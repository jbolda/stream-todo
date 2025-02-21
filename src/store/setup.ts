import {
  Callable,
  createStore,
  createPersistor,
  parallel,
  PERSIST_LOADER_ID,
  persistStoreMdw,
  take,
  AnyState,
  Ok,
  Err,
  call,
  type IdProp,
} from "starfx";
import { open, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";

import {
  AppState,
  initialState as schemaInitialState,
  schema,
  ToDo,
  Stream,
} from "./schema.ts";
import { bytesToBase64, tasks, thunks } from "./thunks/index.ts";
import { Store } from "@tauri-apps/plugin-store";
import { todosPerStream } from "./selectors/stream.ts";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { getDuration } from "./utils.ts";

export function setupStore({
  logs = true,
  initialState = {},
  tauriStore,
}: {
  logs: boolean;
  initialState: AnyState;
  tauriStore: Store;
}) {
  const tauriFilePersistor = createPersistor({
    key: "tauriFile",
    // @ts-expect-error the return type because of IdProp TS is unknown due to `arrayToObject`
    adapter: createTauriFileAdapter<AppState>(tauriStore),
    // reconciler: reconcilerWithReconstitution,
    allowlist: ["streams", "todos"],
  });

  const store = createStore({
    initialState: {
      ...schemaInitialState,
      ...initialState,
    },
    middleware: [persistStoreMdw(tauriFilePersistor)],
  });

  // let socket
  const tsks: Callable<unknown>[] = [
    function* () {
      // TODO wire up websockets
      //  socket = yield* useWebSocket("ws://websocket.example.org");
      // socket.send("Hello World");
      // for (let message of yield* each(socket)) {
      //   console.log("Message from server", message);
      //   yield* each.next();
      // }
    },
  ];
  if (logs) {
    // log all actions dispatched
    tsks.push(function* logActions() {
      while (true) {
        const action = yield* take("*");
        console.log(action);
      }
    });
  }

  tsks.push(thunks.bootup, ...tasks);

  store.run(function* () {
    yield* tauriFilePersistor.rehydrate();
    const group = yield* parallel(tsks);
    yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
    yield* group;
  });

  return store;
}

function parseFileLine(line: string) {
  const [finishedAtQualifier, ...contentStrings] = line.split(": ");
  const finished = finishedAtQualifier.startsWith("unfinished")
    ? []
    : finishedAtQualifier.split("|");
  const content = contentStrings.join(": ");
  const id = bytesToBase64(new TextEncoder().encode(content));
  return { id, content, finishedAt: finished?.[0] };
}

function createTauriFileAdapter<S>(tauriStore: Store) {
  const name = new Date().toISOString().split("T")[0];
  // TODO make this dynamic by user input
  const defaultFileName = `streams/recordings/next/${name}.txt`;
  return {
    getItem: function* (key: string) {
      const fileOpts = {
        write: true,
        create: true,
        baseDir: BaseDirectory.Document,
      };

      const fileListStore = yield* call(
        tauriStore.get<{ files: string[] }>("files")
      );
      const fileList =
        fileListStore?.files && fileListStore?.files?.length > 0
          ? fileListStore.files
          : [defaultFileName];
      try {
        const streams: Stream[] =
          fileList.length === 0
            ? [{ id: name, title: name, filename: defaultFileName }]
            : fileList.map((filename) => {
                // TODO we may not be able to split on this separater
                const loadedFileName = filename
                  .split("/")
                  .pop()
                  ?.replace(".txt", "") as string;
                return {
                  id: loadedFileName,
                  title: loadedFileName,
                  filename: filename,
                };
              });

        const todos = [] as ToDo[];
        for (const filename of fileList) {
          const file = yield* call(open(filename, fileOpts));
          // TODO why isn't a thrown error shown anywhere?
          const stat = yield* call(file.stat());
          let buf = new Uint8Array(stat.size);
          yield* call(file.read(buf));
          const wholeFileContent = new TextDecoder().decode(buf);
          const items =
            wholeFileContent === "" ? [] : wholeFileContent.split("\n");

          for (let i = 0; i < items.length; i++) {
            const line = items[i];
            const { id, content, finishedAt } = parseFileLine(line);
            todos.push({
              id,
              filename,
              content,
              checked: !!finishedAt,
              finishedAt,
              nextToDo: items?.[i + 1] ? parseFileLine(items[i + 1]).id : null,
            });
          }

          yield* call(file.close());
        }

        const storage = {
          streams: arrayToObject(streams),
          todos: arrayToObject(todos),
        };
        return Ok(storage);
      } catch (err: unknown) {
        console.error(err);
        return Err(err as Error);
      }
    },
    setItem: function* (key: string, s: S) {
      // @ts-expect-error fails because of generic due to `arrayToObject`
      const streamTodos = todosPerStream(s);

      try {
        // TODO can we more directly only update files which have changed states
        for (const streamWithTodos of streamTodos) {
          const start = streamWithTodos.todos[0].finishedAt;
          const timeFromState = (finishedAt: string, fromTime: string) => {
            const allSeconds = parseAbsoluteToLocal(finishedAt).compare(
              parseAbsoluteToLocal(fromTime)
            );
            const duration = getDuration(allSeconds);
            return `|${duration.hours
              .toString()
              .padStart(2, "0")}:${duration.minutes
              .toString()
              .padStart(2, "0")}:${duration.seconds
              .toString()
              .padStart(2, "0")}`;
          };
          const state = streamWithTodos.todos
            .map(
              (todo) =>
                `${todo.finishedAt ?? "unfinished"}${
                  start && todo?.finishedAt
                    ? timeFromState(todo.finishedAt, start)
                    : ""
                }: ${todo.content}`
            )
            .join("\n");
          yield* call(
            writeTextFile(streamWithTodos.filename, state, {
              baseDir: BaseDirectory.Document,
            })
          );
        }

        yield* call(
          tauriStore.set("files", {
            files: streamTodos.map((stream) => stream.filename),
          })
        );
      } catch (err: unknown) {
        console.error(err);
        return Err(err as Error);
      }
      return Ok(undefined);
    },
    removeItem: function* (key: string) {
      // TODO handle removal of the files
      return Ok(undefined);
    },
  };
}

function arrayToObject<T extends { id: IdProp }>(inputArray: T[]) {
  return inputArray.reduce((finalRecord, current: T) => {
    // @ts-expect-error fine with generic keys, ignore ts error
    finalRecord[current.id] = current;
    return finalRecord;
  }, {});
}
