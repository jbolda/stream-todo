import type { Selection } from "@adobe/react-spectrum";
import { schema, type ToDo } from "../schema.ts";
import { thunks } from "./foundation.ts";
import { select } from "starfx";

function base64ToBytes(base64) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function bytesToBase64(bytes) {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte)
  ).join("");
  return btoa(binString);
}

export const addToDo = thunks.create<{ content: string }>(
  "todo:add",
  function* (ctx, next) {
    const { content } = ctx.payload;
    const todoItem = {
      id: bytesToBase64(new TextEncoder().encode(content)),
      content,
      checked: false,
    };

    yield* schema.update(schema.todos.add({ [todoItem.id]: todoItem }));

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

export const setToDoSelection = thunks.create<{ selection: Selection }>(
  "todo:selection",
  function* (ctx, next) {
    const { selection } = ctx.payload;
    // TODO change selection to grab only items from this tab
    const todos = yield* select(schema.todos.selectTableAsList);

    if (selection === "all") {
      const selections = todos.reduce((finalSet, item) => {
        finalSet[item.id] = { ...item, checked: true };
        return finalSet;
      }, {} as Record<string, Partial<ToDo>>);
      yield* schema.update(schema.todos.patch(selections));
    } else {
      const selections = todos.reduce((finalSet, item) => {
        finalSet[item.id] = { ...item, checked: selection.has(item.id) };
        return finalSet;
      }, {} as Record<string, Partial<ToDo>>);
      yield* schema.update(schema.todos.patch(selections));
    }
    yield* next();
  }
);
