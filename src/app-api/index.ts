import { setupGlobalShortcuts } from "./setupShortcuts";
import { setupTray } from "./setupTray";
import { NotificationAPI } from "./setupNotifications";
import { Menu, MenuItem, type MenuItemOptions } from "@tauri-apps/api/menu";

export interface TauriAPIs {
  tray: null | Menu;
  notifications?: Awaited<NotificationAPI>;
}

// Store will be loaded automatically when used in JavaScript binding.
export async function initTauri(
  menuItems: MenuItemOptions[]
): Promise<TauriAPIs> {
  const tray = await setupTray({ tooltip: "stream todo app" });

  for (const menuItem of menuItems) {
    const item = await MenuItem.new(menuItem);
    tray.append(item);
  }

  await setupGlobalShortcuts();

  // if (!notifications.permissionGranted) {
  //   const notify = await setupNotifications();
  //   setNotifications(notify);
  // }

  // return { tray, notifications, store };
  return { tray };
}
