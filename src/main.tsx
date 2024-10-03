import React from "react";
import ReactDOM from "react-dom";
import "./main.css";
import App from "./view/App";
import { initTauri } from "./app-api";
import { type MenuItemOptions } from "@tauri-apps/api/menu";

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
const { tray, store } = await initTauri(menuItems);
ReactDOM.render(
  // <React.StrictMode>
  <App tauriAPIs={{ tray, store }} />,
  // </React.StrictMode>,
  document.getElementById("root")
);
