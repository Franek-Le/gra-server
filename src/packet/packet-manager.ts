import type { ConnectPacketData, ImagePacketData, Packet, StartPacketData } from "./packet.js";
import type {
    GameImageScanResultPacketData,
    GameStartServerPacketData,
    ServerPacket,
    ServerPacketData
} from "./server-packet.js";
import type { Game } from "../game/game.js";
import type { Server } from "../server/server.js";
import { u8 } from "../types/integers.js";
import { CURRENT_PROTOCOL_VERSION } from "../protocol/protocol.js"
import { WebSocket } from "ws";

import sizeof from "object-sizeof";

export class PacketManager {
    private readonly game: Game;
    private readonly server: Server;

    public constructor(game: Game, server: Server) {
        this.game = game;
        this.server = server;
    }

    public async handlePacket(client: WebSocket, packet: Packet) {
        switch (packet.type) {
            case 0x00:
                const data: ConnectPacketData = packet.payload as ConnectPacketData;
                const [success, message] = this.game.addPlayer(client, data.username);

                const responsePacket: ServerPacket = this.createPacket(u8(0x02), {
                    success: success,
                    message: message,
                    players: this.game.getPlayers()
                });

                if (success) {
                    const playerListUpdatePacket: ServerPacket = this.createPacket(u8(0x03), {
                        players: this.game.getPlayers()
                    });

                    this.broadcastPacket(playerListUpdatePacket)
                }

                this.server.send(client, responsePacket);

                break;

            case 0x01:
                console.log("disconnect packet")
                this.game.removePlayer(client);

                const playerListUpdatePacket: ServerPacket = this.createPacket(u8(0x03), {
                    players: this.game.getPlayers()
                });

                this.broadcastPacket(playerListUpdatePacket)

                break;

            case 0x02:
                const startPacketData: StartPacketData = packet.payload as StartPacketData
                const gameStartPacket: ServerPacket = this.createPacket(u8(0x00), {} as GameStartServerPacketData)
                this.game.startGame(startPacketData.duration);
                this.server.broadcast(gameStartPacket)
                break;

            case 0x03:
                const sender: string | undefined = this.game.getPlayerNameByWebSocket(client);

                if (sender === undefined) {
                    break;
                }

                const imagePacketData: ImagePacketData = packet.payload as ImagePacketData;
                const success2 = await this.game.validateImage(sender, imagePacketData.data);

                if (success2) {
                    this.game.addPoints(sender, u8(2));
                }

                const gameImageScanResultPacket: ServerPacket = this.createPacket(u8(0x04), {
                    success: success2
                } as GameImageScanResultPacketData)

                this.server.send(client, gameImageScanResultPacket);

                break;

            case 0x04:
                this.game.endGame();
                break;

            default:
                console.log("got unknown packet");
        }
    }

    public sendPacket(player: string, packet: ServerPacket) {
        const client: WebSocket | undefined = this.game.getPlayerWebSocketByName(player);

        if (client === undefined) {
            console.error(`Did not find player: ${player}`);
            return;
        }

        this.server.send(client, packet);
    }

    public broadcastPacket(packet: ServerPacket) {
        this.server.broadcast(packet);
    }

    public createPacket(type: u8, payload: ServerPacketData): ServerPacket {
        return {
            version: CURRENT_PROTOCOL_VERSION,
            type: type,
            timestamp: 0,
            payload_len: sizeof(payload),
            payload: payload,
        } as ServerPacket
    }
}