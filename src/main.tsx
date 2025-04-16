import React from "react";
import { createRoot } from "react-dom/client";
import "./main.css";
import App from "./view/App";
import { initTauri } from "./app-api";
import { type MenuItemOptions } from "@tauri-apps/api/menu";
import { Store } from "@tauri-apps/plugin-store";

import { Provider } from "starfx/react";
import { schema } from "./store/schema.ts";
import { setupStore } from "./store/setup.ts";

// https://github.com/tauri-apps/wry/issues/30#issuecomment-1061465700
// function disableMenu() {
//   if (window.location.hostname !== "tauri.localhost") {
//     return;
//   }

//   document.addEventListener(
//     "contextmenu",
//     (e) => {
//       e.preventDefault();
//       return false;
//     },
//     { capture: true }
//   );

//   document.addEventListener(
//     "selectstart",
//     (e) => {
//       e.preventDefault();
//       return false;
//     },
//     { capture: true }
//   );
// }
// disableMenu();

const menuItems = [
  // {
  //   id: "menuID",
  //   text: "item",
  //   action: async () => {
  //     console.log(`menu "item" clicked`);
  //   },
  // },
] as MenuItemOptions[];
const { tray } = await initTauri(menuItems);

// Create a new store or load the existing one,
const tauriStore = await Store.load("todo-files.json");
const store = setupStore({
  logs: true,
  initialState: {},
  tauriStore,
});

const duration = {
  hours: 1,
  minutes: 46,
  seconds: 40,
};

// With style set to "long" and locale "fr-FR"
const a = new Intl.DurationFormat("fr-FR", { style: "long" }).format(duration);
// "1 heure, 46 minutes et 40 secondes"
console.log(a);
// With style set to "short" and locale "en"
const b = new Intl.DurationFormat("en", { style: "short" }).format(duration);
// "1 hr, 46 min and 40 sec"
console.log(b);

// With style set to "narrow" and locale "pt"
const c = new Intl.DurationFormat("pt", { style: "narrow" }).format(duration);
// "1h 46min 40s"
console.log(c);

const domNode = document.getElementById("root");
// if (domNode) createRoot(domNode).render(<div>hello world</div>);
if (domNode)
  createRoot(domNode).render(
    <Provider schema={schema} store={store}>
      <App tauriAPIs={{ tray }} />
    </Provider>
  );
