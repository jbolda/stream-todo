import { call, createThunks, each, mdw, put, run } from "starfx";
import { useWebSocket } from "./useWebsocket";

const thunks = createThunks();
// where all the thunks get called in the middleware stack
thunks.use(thunks.routes());
// thunks.manage(useWebSocket("ws://websocket.example.org"));

export const wsmiddleware = async function () {
  const sock = await run(function* () {
    let socket = yield* useWebSocket(
      `ws://localhost:${import.meta.env.VITE_WS_PORT}`,
      import.meta.env.VITE_WS_PASSWORD
    );

    for (let message of yield* each(socket)) {
      yield* put({ type: "/wsmessage", payload: message });
      console.log({ yieldedMessages: message });
      yield* each.next();
    }

    return socket;
  });
  return function* (ctx: any, next: any) {
    if (ctx.wsmessage) {
      yield* call(() => sock.send(ctx.wsmessage));
    }
    yield* next();
  };
};
const ws = await wsmiddleware();
thunks.use(ws);

export { thunks };
