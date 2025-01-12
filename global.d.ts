declare module "@teamwork/websocket-json-stream" {
    import { Duplex } from "stream";
    export default function WebSocketJSONStream(socket: WebSocket): Duplex;
}

declare module "ot-text" {
    export const type: any;
}

declare module "rich-text" {
    export const type: any;
}