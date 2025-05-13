export const autoHideOnFocus = true;
// change decorations and visibility in the tauri.conf.json as needed for local dev

const devTime = "";
export const STORE_FILE_LIST_DB = `todo-files${devTime}.json` as const;
export const STORE_FILE_LIST = `files${devTime}` as const;
export const setDefaultFileName = (name: string) =>
  `streams/recordings/next/${name}${devTime}.txt`;
