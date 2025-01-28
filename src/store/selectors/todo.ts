import { AnyState, createSelector } from "starfx";

import { schema, ToDo } from "../schema.ts";

export const todosByStreamFilename = createSelector(
  schema.todos.selectTableAsList,
  (_: AnyState, filename: string) => filename,
  (todos, filename) => {
    return todos.filter((todo) => todo.filename === filename);
  }
);

export const todosByStreamFilenameWithOrder = createSelector(
  (s: AnyState, filename: string) => todosByStreamFilename(s, filename),
  (todos) => {
    const reverseOrdered = [] as ToDo[];

    const last = todos.find((todo) => todo.nextToDo === null);
    if (!last) return [];
    reverseOrdered.push(last);

    for (let prevTodo of reverseOrdered) {
      const next = todos.find((todo) => todo.nextToDo === prevTodo.id);
      if (next) reverseOrdered.push(next);
    }
    return reverseOrdered.reverse();
  }
);
