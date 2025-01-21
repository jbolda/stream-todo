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
  each,
} from "starfx";
import { open, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";

import {
  AppState,
  initialState as schemaInitialState,
  schema,
} from "./schema.ts";
import { tasks, thunks } from "./thunks/index.ts";

const devtoolsEnabled = true;
export function setupStore({
  logs = true,
  initialState = {},
}: {
  logs: boolean;
  initialState: AnyState;
}) {
  const tauriFilePersistor = createPersistor({
    key: "tauriFile",
    adapter: createTauriFileAdapter<AppState>(),
    // reconciler: reconcilerWithReconstitution,
    allowlist: ["streams", "todos"],
  });

  const store = createStore({
    initialState: {
      ...schemaInitialState,
      ...initialState,
    },
    // TODO create custom persistStoreMdw to save partial state snapshots to specific files
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

function createTauriFileAdapter<S>() {
  const name = new Date().toISOString().split("T")[0];
  // TODO this will end up being dynamic from the custom persistStoreMdw rewrite
  const filename = `streams/recordings/next/${name}.txt`;
  return {
    getItem: function* (key: string) {
      const fileOpts = {
        write: true,
        create: true,
        baseDir: BaseDirectory.Document,
      };
      try {
        const file = yield* call(open(filename, fileOpts));
        // TODO why isn't a thrown error shown anywhere?
        const stat = yield* call(file.stat());
        let buf = new Uint8Array(stat.size);
        yield* call(file.read(buf));
        const content = new TextDecoder().decode(buf);
        yield* call(file.close());

        const storage = content || "{}";
        return Ok(JSON.parse(storage));
      } catch (err: unknown) {
        return Err(err as Error);
      }
    },
    setItem: function* (key: string, s: S) {
      const state = JSON.stringify(s, null, 2);
      console.log({ state });
      try {
        yield* call(
          writeTextFile(filename, state, {
            baseDir: BaseDirectory.Document,
          })
        );
      } catch (err: unknown) {
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
