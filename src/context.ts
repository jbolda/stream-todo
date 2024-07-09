import { Menu } from "@tauri-apps/api/menu";
import { createContext } from "react";
import { NotificationAPI } from "./app-api/setupNotifications";
import { Store } from "@tauri-apps/plugin-store";

export const SystemTrayContext = createContext<{
  tray: null | Menu;
  notifications: Awaited<NotificationAPI>;
  store: null | Store;
}>({
  tray: null,
  notifications: {
    send: async () => console.log("notifications not initialized"),
    permissionGranted: false,
  },
  store: null,
});
