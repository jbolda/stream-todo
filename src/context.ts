import { createContext } from "react";
import type { TauriAPIs } from "./app-api";

export const SystemTrayContext = createContext<TauriAPIs>({
  tray: null,
  notifications: {
    send: async () => console.log("notifications not initialized"),
    permissionGranted: false,
  },
  store: null,
});
