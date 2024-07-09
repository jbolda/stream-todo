import { Menu } from "@tauri-apps/api/menu";
import { TrayIcon, TrayIconEvent } from "@tauri-apps/api/tray";
import {
  LogicalPosition,
  LogicalSize,
  getCurrent,
} from "@tauri-apps/api/window";

export const setupTray = async ({ tooltip }: { tooltip?: string }) => {
  const action = async (event: TrayIconEvent) => {
    if ("click" in event) {
      const { click } = event;
      const window = getCurrent();

      // The mini-pop-up window should automatically
      //  hide once you stop giving it focus
      await getCurrent().onFocusChanged(({ payload: focused }) => {
        if (!focused) window.hide();
      });

      if (click.button === "Right") {
        await window.hide();
      } else {
        const windowSize = await window.innerSize();
        const iconOffset = 30;
        const position = new LogicalPosition(
          // @ts-expect-error the types are wrong
          click.position.x - windowSize.width,
          // @ts-expect-error the types are wrong
          click.position.y - windowSize.height - iconOffset
        );
        const positioned = await window.setPosition(position);
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
