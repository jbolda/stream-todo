import { createThunks } from "starfx";
import { useWebSocket } from "./useWebsocket";

const thunks = createThunks();
// where all the thunks get called in the middleware stack
thunks.use(thunks.routes());

thunks.manage(
  "obs-websocket",
  useWebSocket(
    `ws://localhost:${import.meta.env.VITE_WS_PORT}`,
    import.meta.env.VITE_WS_PASSWORD
  )
);

export { thunks };
