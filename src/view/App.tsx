import React from "react";
import "./App.css";
import Home from "./Home";
import { SystemTrayContext } from "../context";
import { useTauri } from "../hooks/setup";
import { type MenuItemOptions } from "@tauri-apps/api/menu";
import {
  defaultTheme,
  Provider as ReactSpectrumProvider,
} from "@adobe/react-spectrum";

const menuItems = [
  // {
  //   id: "menuID",
  //   text: "item",
  //   action: async () => {
  //     console.log(`menu "item" clicked`);
  //   },
  // },
] as MenuItemOptions[];

function App() {
  const tauriAPIs = useTauri(menuItems);

  return (
    <SystemTrayContext.Provider value={tauriAPIs}>
      <ReactSpectrumProvider theme={defaultTheme}>
        {!tauriAPIs?.store ? null : <Home />}
      </ReactSpectrumProvider>
    </SystemTrayContext.Provider>
  );
}

export default App;
