import { ItemDropTarget, Key } from "@adobe/react-spectrum";
import { schema } from "../schema.ts";
import { thunks } from "./foundation.ts";
import { select } from "starfx";
import { getLocalTimeZone, now } from "@internationalized/date";

function base64ToBytes(base64: string) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => {
    const c = m.codePointAt(0);
    if (!c) throw Error(`missed codepoint in conversion of ${base64}`);
    return c;
  });
}

export function bytesToBase64(bytes: Uint8Array<ArrayBufferLike>) {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte)
  ).join("");
  return btoa(binString);
}

export const addToDo = thunks.create<{ filename: string; content: string }>(
  "todo:add",
  function* (ctx, next) {
    const { filename, content } = ctx.payload;
    const allTodos = yield* select(schema.todos.selectTableAsList);
    const last = allTodos.find(
      (todo) => todo.filename === filename && todo.nextToDo === null
    );
    const todoItem = {
      id: bytesToBase64(new TextEncoder().encode(content)),
      filename,
      content,
      checked: false,
      nextToDo: null,
    };

    const priorExisting = allTodos.find((todo) => todo.id === todoItem.id);
    if (!priorExisting) {
      const addItem = { [todoItem.id]: todoItem };
      if (last?.id) {
        yield* schema.update([
          schema.todos.add(addItem),
          schema.todos.patch({ [last.id]: { nextToDo: todoItem.id } }),
        ]);
      } else {
        yield* schema.update(schema.todos.add(addItem));
      }
    }

    yield* next();
  }
);

export const removeToDo = thunks.create<{ id: string | number }>(
  "todo:remove",
  function* (ctx, next) {
    const { id } = ctx.payload;
    yield* schema.update(schema.todos.remove([id]));
    yield* next();
  }
);

export const setToDoSelection = thunks.create<{
  isSelected: boolean;
  id: string;
}>("todo:selection", function* (ctx, next) {
  const { isSelected, id } = ctx.payload;
  yield* schema.update(
    schema.todos.patch({
      [id]: {
        checked: isSelected,
        finishedAt: isSelected
          ? now(getLocalTimeZone()).toAbsoluteString()
          : undefined,
      },
    })
  );
  yield* next();
});

export const setToDoOrder = thunks.create<{
  keys: Set<Key>;
  target: ItemDropTarget;
}>("todo:order", function* (ctx, next) {
  const { keys, target } = ctx.payload;
  const movingToDoKey = [...keys.values()].pop();

  const todos = yield* select(schema.todos.selectTableAsList);
  if (movingToDoKey && movingToDoKey !== target.key) {
    if (target.dropPosition === "before") {
      const aboveMovingTodo = todos.find(
        (todo) => todo.nextToDo === movingToDoKey
      );
      const movingToDo = todos.find((todo) => todo.id === movingToDoKey);
      const aboveMovedTodo = todos.find((todo) => todo.nextToDo === target.key);

      if (!movingToDo) {
        console.error("failure updating drag order");
      } else if (movingToDo.nextToDo !== target.key) {
        yield* schema.update(
          schema.todos.patch({
            ...(!aboveMovingTodo
              ? {}
              : {
                  [aboveMovingTodo.id]: {
                    nextToDo: movingToDo.nextToDo,
                  },
                }),

            [movingToDo.id]: {
              nextToDo: target.key as string,
            },

            ...(!aboveMovedTodo
              ? {}
              : {
                  [aboveMovedTodo.id]: {
                    nextToDo: movingToDo.id,
                  },
                }),
          })
        );
      }
    } else if (target.dropPosition === "after") {
      const aboveMovingTodo = todos.find(
        (todo) => todo.nextToDo === movingToDoKey
      );
      const movingToDo = todos.find((todo) => todo.id === movingToDoKey);
      const aboveMovedTodo = todos.find((todo) => todo.id === target.key);

      if (!movingToDo || !aboveMovedTodo) {
        console.error("failure updating drag order");
      } else {
        yield* schema.update(
          schema.todos.patch({
            ...(!aboveMovingTodo
              ? {}
              : {
                  [aboveMovingTodo.id]: {
                    nextToDo: movingToDo.nextToDo,
                  },
                }),
            [movingToDo.id]: {
              nextToDo: aboveMovedTodo.nextToDo,
            },
            [target.key]: {
              nextToDo: movingToDo.id,
            },
          })
        );
      }
    }
  }

  yield* next();
});
