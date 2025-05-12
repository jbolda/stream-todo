import { setDefaultFileName } from "../../config.ts";
import { schema } from "../schema.ts";
import { thunks } from "./foundation.ts";

export const addStream = thunks.create("stream:add", function* (ctx, next) {
  const name = new Date().toISOString().split("T")[0];
  const entry = {
    [name]: {
      id: name,
      title: name,
      // TODO allow the user to set default or something?
      filename: setDefaultFileName(name),
    },
  };

  yield* schema.update(schema.streams.add(entry));

  yield* next();
});

export const removeStream = thunks.create<{ id: string }>(
  "stream:remove",
  function* (ctx, next) {
    const { id } = ctx.payload;
    yield* schema.update(schema.streams.remove([id]));
    yield* next();
  }
);
