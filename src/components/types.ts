import { BaseDirectory } from "@tauri-apps/plugin-fs";

export type FileOpts = {
  name: string;
  options: {
    write: boolean;
    create: boolean;
    truncate: boolean;
    baseDir: BaseDirectory;
  };
};
export type TabListItem = { id: string; title: string; fileOpts?: FileOpts };
export type TabList = { items: TabListItem[] };
