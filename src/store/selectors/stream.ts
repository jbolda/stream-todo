import { AnyState, createSelector } from "starfx";

import { schema } from "../schema.ts";
import { todosByStreamFilenameWithOrder } from "./todo.ts";

export const todosPerStream = createSelector(
  schema.streams.selectTableAsList,
  (state: AnyState) => state,
  (streams, state) => {
    return streams.map((stream) => {
      const todos = todosByStreamFilenameWithOrder(state, stream.filename);
      return {
        filename: stream.filename,
        todos,
      };
    });
  }
);
