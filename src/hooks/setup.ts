import React, { useEffect, useState } from "react";
import { setupGlobalShortcuts } from "../app-api/setupShortcuts";
import { setupTray } from "../app-api/setupTray";
import {
  NotificationAPI,
  setupNotifications,
} from "../app-api/setupNotifications";
import { Menu, MenuItem, type MenuItemOptions } from "@tauri-apps/api/menu";
import { Store } from "@tauri-apps/plugin-store";

// Store will be loaded automatically when used in JavaScript binding.
export function useTauri(menuItems: MenuItemOptions[]) {
  const [tray, setTray] = useState<null | Menu>(null);
  const [notifications, setNotifications] = useState<Awaited<NotificationAPI>>({
    send: async () => console.log("notifications not initialized"),
    permissionGranted: false,
  });
  const [store, setStore] = useState<null | Store>(null);

  useEffect(() => {
    async function effectUsed() {
      const initialTray = await setupTray({ tooltip: "personal tray app" });
      setTray(initialTray);

      for (const menuItem of menuItems) {
        const item = await MenuItem.new(menuItem);
        initialTray.append(item);
      }

      await setupGlobalShortcuts();
      const setupStore = new Store("store.bin");

      // await setupStore.reset();
      if (!(await setupStore?.get("tabs")))
        await setupStore.set("tabs", {
          items: [{ id: "stream-1", title: "stream 1" }],
        });
      setStore(setupStore);
    }
    effectUsed();
  }, []);

  useEffect(() => {
    async function effectUsed() {
      if (!notifications.permissionGranted) {
        const notify = await setupNotifications();
        setNotifications(notify);
      }
    }
    effectUsed();
  }, [notifications.permissionGranted]);

  return { tray, notifications, store };
}
