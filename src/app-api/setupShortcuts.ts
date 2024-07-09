import {
  isRegistered,
  register,
  ShortcutEvent,
} from "@tauri-apps/plugin-global-shortcut";
import { Window } from "@tauri-apps/api/window";

export const setupGlobalShortcuts = async () => {
  const commandShortcut = "Ctrl+Alt+Space";
  const registered = await isRegistered(commandShortcut);
  if (registered) return;
  // command shortcuts are a combination
  //   of modifiers and one key code
  // list of modifiers:
  //   - https://docs.rs/global-hotkey/0.2.1/global_hotkey/hotkey/struct.Modifiers.html
  //   - based on this spec: https://w3c.github.io/uievents-key/#keys-modifier
  // list of key codes: https://docs.rs/global-hotkey/0.2.1/global_hotkey/hotkey/enum.Code.html
  await register(commandShortcut, async (event: ShortcutEvent) => {
    if (event.state === "Released") return;
    // @ts-expect-error type signature appears incorrect
    const window = new Window("main", { skip: true });
    const visible = await window.isVisible();
    if (visible) {
      await window.hide();
    } else {
      // uses the default window size and centers
      await window.center();
      await window.show().then(() => window.setFocus());
    }
  });
};
