import { createSchema, slice } from "starfx";

export interface Stream {
  id: string;
  title: string;
  filename: string;
}

export interface ToDo {
  id: string;
  content: string;
  checked: boolean;
}

const [schema, initialState] = createSchema({
  cache: slice.table({ empty: {} }),
  loaders: slice.loaders(),
  streams: slice.table<Stream>({
    initialState: {
      default: { id: "default", title: "default", filename: "" },
    },
  }),
  todos: slice.table<ToDo>(),
});

export { schema, initialState };

export type AppState = typeof initialState;
