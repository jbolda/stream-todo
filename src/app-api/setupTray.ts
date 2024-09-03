import { Menu } from "@tauri-apps/api/menu";
import { TrayIcon, TrayIconEvent } from "@tauri-apps/api/tray";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { moveWindow, Position } from "@tauri-apps/plugin-positioner";

export const setupTray = async ({ tooltip }: { tooltip?: string }) => {
  const action = async (event: TrayIconEvent) => {
    if ("click" in event) {
      const { click } = event;
      const window = getCurrentWindow();

      // The mini-pop-up window should automatically
      //  hide once you stop giving it focus
      await getCurrentWindow().onFocusChanged(({ payload: focused }) => {
        if (!focused) window.hide();
      });

      if (click.button === "Right") {
        await window.hide();
      } else {
        await moveWindow(Position.TrayCenter);
        await window.show().then(() => window.setFocus());
      }
    }
  };
  const tray = await TrayIcon.new({ id: "js_tray_icon", action });
  if (tooltip) tray.setTooltip(tooltip);
  await tray.setIcon("icons/icon.png");
  const menu = await Menu.new();
  await tray.setMenu(menu);
  return menu;
};
