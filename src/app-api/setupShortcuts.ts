import {
  isRegistered,
  register,
  ShortcutEvent,
} from "@tauri-apps/plugin-global-shortcut";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { moveWindowConstrained, Position } from "@tauri-apps/plugin-positioner";

export const setupGlobalShortcuts = async () => {
  const commandShortcut = "Alt+Space";
  const registered = await isRegistered(commandShortcut);
  if (registered) return;
  try {
    // command shortcuts are a combination
    //   of modifiers and one key code
    // list of modifiers:
    //   - https://docs.rs/global-hotkey/0.2.1/global_hotkey/hotkey/struct.Modifiers.html
    //   - based on this spec: https://w3c.github.io/uievents-key/#keys-modifier
    // list of key codes: https://docs.rs/global-hotkey/0.2.1/global_hotkey/hotkey/enum.Code.html
    await register(commandShortcut, async (event: ShortcutEvent) => {
      if (event.state === "Released") return;
      const window = getCurrentWindow();
      // The mini-pop-up window should automatically
      //  hide once you stop giving it focus
      await getCurrentWindow().onFocusChanged(({ payload: focused }) => {
        if (!focused) window.hide();
      });

      const visible = await window.isVisible();
      if (visible) {
        await window.hide();
      } else {
        await moveWindowConstrained(Position.TrayRight);
        await window.show().then(() => window.setFocus());
      }
    });
  } catch (error) {
    // a niceity but don't fail to load app if it cannot register
    console.error(error);
  }
};
