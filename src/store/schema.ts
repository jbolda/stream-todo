import { createSchema, slice } from "starfx";

type ID = string;
export interface Stream {
  id: ID;
  title: string;
  filename: string;
}

export interface ToDo {
  id: ID;
  filename: string;
  content: string;
  checked: boolean;
  finishedAt?: string;
  timecode?: string;
  nextToDo: ID | null;
}

const [schema, initialState] = createSchema({
  cache: slice.table({ empty: {} }),
  loaders: slice.loaders(),
  streams: slice.table<Stream>(),
  todos: slice.table<ToDo>(),
});

export { schema, initialState };

export type AppState = typeof initialState;
