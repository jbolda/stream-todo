import {
  createSignal,
  once,
  race,
  resource,
  spawn,
  action,
  Err,
  Ok,
  suspend,
  call,
} from "effection";
import type { Operation, Stream, Result } from "effection";
import {
  authenticationHashing,
  OutgoingMessage,
  WebSocketOpCode,
  OBSResponseTypes,
} from "../utils/obs";

/**
 * Handle to a
 * [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) object
 * that can be consumed as an Effection stream. It has all the same properties as
 * the underlying `WebSocket` apart from the event handlers. Instead, the resource
 * itself is a subscribale stream. When the socket is closed, the stream will
 * complete with a [`CloseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent)
 *
 * A WebSocketResource does not have an explicit close method. Rather, the underlying
 * socket will be automatically closed when the resource passes out of scope.
 */
export interface WebSocketResource<T>
  extends Stream<MessageEvent<T>, CloseEvent> {
  /**
   * the type of data that this websocket accepts
   */
  readonly binaryType: BinaryType;
  readonly bufferedAmmount: number;
  readonly extensions: string;
  readonly protocol: string;
  readonly readyState: number;
  readonly url: string;
  send(data: WebSocketData): void;
}

/**
 * Create a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
 * resource using the native
 * [WebSocket constructor](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket)
 * available on the current platform.
 *
 * The resource will not be returned until a connection has been
 * succesffuly established with the server and the
 * [`open`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/open_event)
 * has been received. Once initialized, it will crash if it receives
 * an [`error`]() event at any time.
 *
 * Once created, the websocket resource can be use to consume events from the server:
 *
 * ```ts
 * let socket = yield* useWebSocket("ws://websocket.example.org");
 *
 * for (let event of yield* each(socket)) {
 *   console.log('event data: ', event.data);
 *   yield* each.next();
 * }
 * ```
 *
 * @param url - The URL of the target WebSocket server to connect to. The URL must use one of the following schemes: ws, wss, http, or https, and cannot include a URL fragment. If a relative URL is provided, it is relative to the base URL of the calling script. For more detail, see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#url
 *
 * @param prototol - A single string or an array of strings representing the sub-protocol(s) that the client would like to use, in order of preference. If it is omitted, an empty array is used by default, i.e. []. For more details, see
 *
 * @returns an operation yielding a {@link WebSocketResource}
 */
export function useWebSocket<T>(
  url: string,
  protocols?: string
): Operation<WebSocketResource<T>>;

/**
 * Create a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
 * resource, but delegate the creation of the underlying websocket to a function
 * of your choice. This is necessary on platforms that do not have a global
 * `WebSocket` constructor such as NodeJS \<= 20.
 *
 * The resource will not be returned until a connection has been
 * succesffuly established with the server and the
 * [`open`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/open_event)
 * has been received. Once initialized, it will crash if it receives
 * an [`error`]() event at any time.
 *
 * Once created, the websocket resource can be use to consume events from the server:
 *
 * ```ts
 * import * as ws from 'ws';
 *
 * function* example() {
 *   let socket = yield* useWebSocket(() => new ws.WebSocket("ws://websocket.example.org"));
 *
 *   for (let event of yield* each(socket)) {
 *     console.log('event data: ', event.data);
 *     yield* each.next();
 *   }
 * }
 *
 * ```
 * @param create - a function that will construct the underlying [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) object that this resource wil use
 * @returns an operation yielding a {@link WebSocketResource}
 */
export function useWebSocket<T>(
  create: () => WebSocket
): Operation<WebSocketResource<T>>;

/**
 * @ignore the catch-all version that supports both forms above.
 */
export function useWebSocket<T>(
  url: string | (() => WebSocket),
  password?: string,
  protocols?: string
): Operation<WebSocketResource<T>> {
  return resource(function* (provide) {
    let socket =
      typeof url === "string" ? new WebSocket(url, protocols) : url();

    let messages = createSignal<MessageEvent<T>, CloseEvent>();
    let { operation: closed, resolve: close } = withResolvers<CloseEvent>();
    socket.addEventListener("error", (error) => {
      console.log("error event listener triggered");
      console.error(error);
    });
    socket.addEventListener("close", (error) => {
      console.log("close event listener triggered");
      console.error(error);
    });
    yield* once(socket, "open");

    // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#connection-steps
    let d: Record<string, string>;
    socket.addEventListener("message", (message) => {
      console.log(JSON.parse(message.data));
      if (message.data) {
        const data = JSON.parse(message.data);
        d = data.d;
      }
      messages.send(message);
    });
    // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#hello-opcode-0
    // wait for hello with op 0
    yield* once(socket, "message");
    console.log({ d });
    // const hello = await this.createConnection(url);
    // this.emit('Hello', hello);
    //  this.identify(hello, password, identificationParams);
    const data = {
      rpcVersion: d.rpcVersion,
      authentication: undefined as string | undefined,
    };
    if (password) {
      data.authentication = yield* authenticationHashing(
        d.authentication.salt,
        d.authentication.challenge,
        password
      );
    }
    const handshake: OutgoingMessage = {
      op: WebSocketOpCode.Identify,
      d: data,
    };
    console.log({ handshake });
    // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#identify-opcode-1
    // send indentify with op 1
    yield* call(() => socket.send(JSON.stringify(handshake)));

    yield* once(socket, "message");

    const t: OutgoingMessage = {
      op: WebSocketOpCode.Request,
      d: {
        requestType: "GetStreamStatus",
        requestId: "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c",
      },
    };
    const streamStatusResponse = yield* call(() =>
      socket.send(JSON.stringify(t))
    );
    // yield* spawn(function* () {
    //   throw yield* once(socket, "error");
    // });

    yield* spawn(function* () {
      let subscription = yield* messages;
      let next = yield* subscription.next();
      while (!next.done) {
        next = yield* subscription.next();
      }
      close(next.value);
    });

    try {
      socket.addEventListener("message", messages.send);
      socket.addEventListener("close", messages.close);

      yield* race([
        closed,
        provide({
          get binaryType() {
            return socket.binaryType;
          },
          get bufferedAmmount() {
            return socket.bufferedAmount;
          },
          get extensions() {
            return socket.extensions;
          },
          get protocol() {
            return socket.protocol;
          },
          get readyState() {
            return socket.readyState;
          },
          get url() {
            return socket.url;
          },
          send: (data) => socket.send(data),
          [Symbol.iterator]: messages[Symbol.iterator],
        }),
      ]);
    } finally {
      console.log("finally");
      socket.close(1000, "released");
      yield* closed;
      socket.removeEventListener("message", messages.send);
      socket.removeEventListener("close", messages.close);
    }
  });
}

/**
 * @ignore
 */
export type WebSocketData = Parameters<WebSocket["send"]>[0];

export interface WithResolvers<T> {
  operation: Operation<T>;
  resolve(value: T): void;
  reject(error: Error): void;
}

export function withResolvers<T>(): WithResolvers<T> {
  let subscribers: Set<Resolver<T>> = new Set();
  let settlement: Result<T> | undefined = undefined;
  let operation = action<T>(function* (resolve, reject) {
    let resolver = { resolve, reject };
    if (settlement) {
      notify(settlement, resolver);
    } else {
      try {
        subscribers.add(resolver);
        yield* suspend();
      } finally {
        subscribers.delete(resolver);
      }
    }
  });

  let settle = (result: Result<T>) => {
    if (!settlement) {
      settlement = result;
      settle = () => {};
    }
    for (let subscriber of subscribers) {
      subscribers.delete(subscriber);
      notify(settlement, subscriber);
    }
  };

  let resolve = (value: T) => {
    settle(Ok(value));
  };
  let reject = (error: Error) => {
    settle(Err(error));
  };

  return { operation, resolve, reject };
}

interface Resolver<T> {
  resolve(value: T): void;
  reject(error: Error): void;
}

function notify<T>(result: Result<T>, resolver: Resolver<T>): void {
  if (result.ok) {
    resolver.resolve(result.value);
  } else {
    resolver.reject(result.error);
  }
}
