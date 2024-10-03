import { Menu } from "@tauri-apps/api/menu";
import { TrayIcon, TrayIconEvent } from "@tauri-apps/api/tray";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  moveWindow,
  Position,
  handleIconState,
} from "@tauri-apps/plugin-positioner";

export const setupTray = async ({ tooltip }: { tooltip?: string }) => {
  const action = async (event: TrayIconEvent) => {
    await handleIconState(event);
    if (event.type === "Click") {
      const window = getCurrentWindow();
      // The mini-pop-up window should automatically
      //  hide once you stop giving it focus
      await getCurrentWindow().onFocusChanged(({ payload: focused }) => {
        if (!focused) window.hide();
      });

      if (event.button === "Right") {
        await window.hide();
      } else {
        await moveWindow(Position.TrayCenter);
        await window.show().then(() => window.setFocus());
      }
    }
  };

  // this will handle cases in dev with hot reloading
  //  and with the initial icon set by the Rust-based
  //  Tauri builder setup function
  const existing = await TrayIcon.getById("main");
  if (existing) {
    // if we adjust the visibility state first
    //  then it seems to release the icon and item
    //  otherwise it never closes or disappears
    await existing.setVisible(false);
    await existing.close();
  }

  const tray = await TrayIcon.new({ id: "main", action });
  if (tooltip) tray.setTooltip(tooltip);
  await tray.setIcon("icons/icon.png");
  const menu = await Menu.new();
  await tray.setMenu(menu);
  return menu;
};
