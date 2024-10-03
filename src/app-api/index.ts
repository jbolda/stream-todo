import { setupGlobalShortcuts } from "./setupShortcuts";
import { setupTray } from "./setupTray";
import { NotificationAPI } from "./setupNotifications";
import { Menu, MenuItem, type MenuItemOptions } from "@tauri-apps/api/menu";
import { createStore, Store } from "@tauri-apps/plugin-store";

export interface TauriAPIs {
  tray: null | Menu;
  notifications?: Awaited<NotificationAPI>;
  store: null | Store;
}

// Store will be loaded automatically when used in JavaScript binding.
export async function initTauri(
  menuItems: MenuItemOptions[]
): Promise<TauriAPIs> {
  const tray = await setupTray({ tooltip: "personal tray app" });

  for (const menuItem of menuItems) {
    const item = await MenuItem.new(menuItem);
    tray.append(item);
  }

  await setupGlobalShortcuts();
  const store = await createStore("store.bin", {
    // @ts-expect-error type and invoke call mismatch
    autoSave: 1,
  });

  // await store.reset();
  if (!(await store?.get("tabs")))
    await store.set("tabs", {
      items: [{ id: "stream-1", title: "stream 1" }],
    });

  // if (!notifications.permissionGranted) {
  //   const notify = await setupNotifications();
  //   setNotifications(notify);
  // }

  // return { tray, notifications, store };
  return { tray, store };
}
