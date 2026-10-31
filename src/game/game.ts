import { PacketManager } from "../packet/packet-manager.js";
import { PlayerManager } from "../player/player-manager.js";
import { PointManager } from "../points/point-manager.js";
import { WebSocket } from "ws";
import type { Server } from "../server/server.js";
import type { Packet } from "../packet/packet.js";
import { u8 } from "../types/integers.js";
import type { GameEndServerPacketData, ServerPacket } from "../packet/server-packet.js";
import { Detector } from "../detection/detector.js";

export class Game {
    private readonly packetManager: PacketManager;
    private readonly playerManager: PlayerManager;
    private readonly detector: Detector;
    private pointManager: PointManager | null = null;

    private running: boolean = false;

    public constructor(server: Server) {
        this.detector = new Detector();
        this.packetManager = new PacketManager(this, server);
        this.playerManager = new PlayerManager(this.detector);

        server.addConnectHandler(() => {
            console.log("connected")
        })

        server.addPacketHandler(async (client: WebSocket, packet: Packet) => {
            await this.packetManager.handlePacket(client, packet);
        })

        server.addDisconnectHandler((client: WebSocket) => {
            console.log("disconnected");

            const playerListUpdatePacket: ServerPacket = this.packetManager.createPacket(u8(0x03), {
                players: this.getPlayers()
            });

            this.packetManager.broadcastPacket(playerListUpdatePacket)

            this.playerManager.removePlayer(client);
        })
    }

    public startGame(duration: u8): void {
        if (this.running) {
            return;
        }

        this.running = true;

        console.log(`Starting game with duration of ${duration} minutes`);

        const players: string[] = this.playerManager.getPlayers().values().toArray();

        this.pointManager = new PointManager(players);

        const total = duration * 60 * 1000;
        const end = Date.now() + total;

        const timer = setInterval(() => {
            const remaining = Math.max(0, end - Date.now());

            if (remaining === 0 || !this.running) {
                clearInterval(timer);

                this.endGame();
            }
        })
    }

    public endGame(): void {
        if (!this.running) {
            return;
        }

        this.running = false;

        const packet = this.packetManager.createPacket(u8(0x01), {
            leaderboard: this.pointManager?.getLeaderboard()
        } as GameEndServerPacketData)

        this.packetManager.broadcastPacket(packet);

        for (let player in this.playerManager.getPlayers()) {
            this.playerManager.removePlayer(player);
        }
    }

    public addPlayer(client: WebSocket, username: string): [boolean, string] {
        return this.playerManager.addPlayer(client, username);
    }

    public removePlayer(player: WebSocket | string) {
        this.playerManager.removePlayer(player);
    }

    public getPlayerWebSocketByName(username: string): WebSocket | undefined {
        return this.playerManager.getPlayerWebSocketByName(username);
    }

    public getPlayerNameByWebSocket(socket: WebSocket): string | undefined {
        return this.playerManager.getPlayerNameByWebSocket(socket);
    }

    public addPoints(username: string, points: u8) {
        if (this.pointManager === null) {
            console.log("point manager is null");
        }

        this.pointManager?.addPoints(username, points);
    }

    public async validateImage(sender: string, image: Uint8Array): Promise<boolean> {
        return this.playerManager.validateImage(sender, image);
    }

    public getPlayers(): Array<string> {
        return this.playerManager.getPlayers().values().toArray();
    }
}