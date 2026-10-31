import { WebSocketServer, WebSocket, type RawData } from "ws";
import { i16, type u16 } from "../types/integers.js";
import type { Packet } from "../packet/packet.js";
import { PacketFactory } from "../packet/packet-factory.js";
import type { ServerPacket } from "../packet/server-packet.js";
import {ServerPacketSerializer} from "../packet/server-packet-serializer.js";

export type ConnectHandler = (client: WebSocket) => void;
export type DisconnectHandler = (client: WebSocket, code: i16, reason: string) => void;
export type PacketHandler = (client: WebSocket, packet: Packet) => Promise<void>;

export class Server {
    private readonly server: WebSocketServer;

    private readonly connectHandlers: ConnectHandler[];
    private readonly disconnectHandlers: DisconnectHandler[];
    private readonly packetHandlers: PacketHandler[];

    public constructor(port: u16) {
        this.connectHandlers = [];
        this.disconnectHandlers = [];
        this.packetHandlers = [];

        this.server = new WebSocketServer({ host: "0.0.0.0", port: port });

        this.server.on("connection", (socket) => {
            this.connectHandlers.forEach((handler: ConnectHandler) => {
                handler(socket);
            })

            socket.on("message", (data: RawData) => {
                const dataArray: Uint8Array = this.toUint8Array(data);

                const packet: Packet = PacketFactory.createPacket(dataArray);

                this.packetHandlers.forEach(async (handler: PacketHandler) => {
                    await handler(socket, packet);
                });

                console.log("Got packet");
            })

            socket.on("close", (code, reason) => {
                this.disconnectHandlers.forEach((handler: DisconnectHandler) => {
                    handler(socket, i16(code), reason.toString());
                })
            })
        })

        console.log("Server running.");
    }

    send(client: WebSocket, packet: ServerPacket): void {
        if (client.readyState !== WebSocket.OPEN) return;

        const data = ServerPacketSerializer.serialize(packet);
        client.send(data.toUint8Array());
        console.log("Sent packet with type: ", packet.type);
    }

    broadcast(packet: ServerPacket, except?: WebSocket): void {
        const data = ServerPacketSerializer.serialize(packet);

        for (const client of this.server.clients) {
            if (client !== except && client.readyState === WebSocket.OPEN) {
                client.send(data.toUint8Array());
            }
        }

        console.log("Broadcasted packet with type: ", packet.type);
    }

    public addConnectHandler(handler: ConnectHandler) {
        this.connectHandlers.push(handler);
    }

    public addDisconnectHandler(handler: DisconnectHandler) {
        this.disconnectHandlers.push(handler);
    }

    public addPacketHandler(handler: PacketHandler) {
        this.packetHandlers.push(handler);
    }

    public close(): void {
        this.server.close();
        console.log("Server closed.");
    }

    private toUint8Array(rawData: RawData): Uint8Array {
        if (Buffer.isBuffer(rawData)) {
            return new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength);
        }

        if (rawData instanceof ArrayBuffer) {
            return new Uint8Array(rawData);
        }

        if (Array.isArray(rawData)) {
            const totalLength = rawData.reduce((acc, buf) => acc + buf.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const buf of rawData) {
                result.set(buf, offset);
                offset += buf.length;
            }
            return result;
        }

        throw new Error("Unsupported RawData type");
    }
}