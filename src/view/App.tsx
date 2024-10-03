import React from "react";
import "./App.css";
import Home from "./Home";
import { SystemTrayContext } from "../context";
import {
  defaultTheme,
  Provider as ReactSpectrumProvider,
} from "@adobe/react-spectrum";
import { TauriAPIs } from "../app-api";

function App({ tauriAPIs }: { tauriAPIs: TauriAPIs }) {
  return (
    <SystemTrayContext.Provider value={tauriAPIs}>
      <ReactSpectrumProvider theme={defaultTheme}>
        <Home />
      </ReactSpectrumProvider>
    </SystemTrayContext.Provider>
  );
}

export default App;
