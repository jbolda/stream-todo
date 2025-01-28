import React from "react";
import { createRoot } from "react-dom/client";
import "./main.css";
import App from "./view/App";
import { initTauri } from "./app-api";
import { type MenuItemOptions } from "@tauri-apps/api/menu";
import { load } from "@tauri-apps/plugin-store";

import { Provider } from "starfx/react";
import { schema } from "./store/schema.ts";
import { setupStore } from "./store/setup.ts";

// https://github.com/tauri-apps/wry/issues/30#issuecomment-1061465700
function disableMenu() {
  if (window.location.hostname !== "tauri.localhost") {
    return;
  }

  document.addEventListener(
    "contextmenu",
    (e) => {
      e.preventDefault();
      return false;
    },
    { capture: true }
  );

  document.addEventListener(
    "selectstart",
    (e) => {
      e.preventDefault();
      return false;
    },
    { capture: true }
  );
}
disableMenu();

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
const tauriStore = await load("todo-files.json");

const store = setupStore({
  logs: true,
  initialState: {},
  tauriStore,
});

const domNode = document.getElementById("root");
if (domNode)
  createRoot(domNode).render(
    <Provider schema={schema} store={store}>
      <App tauriAPIs={{ tray }} />
    </Provider>
  );
