import { WebSocket } from "ws";
import type { Detector } from "../detection/detector.js";

export class PlayerManager {
    private readonly players: Map<WebSocket, string>;
    private readonly lastScans: Map<string, Date>;
    private readonly detector: Detector;

    public constructor(detector: Detector) {
        this.players = new Map<WebSocket, string>();
        this.lastScans = new Map<string, Date>();
        this.detector = detector;
    }

    public addPlayer(client: WebSocket, username: string): [boolean, string] {
        if (this.players.has(client)) {
            return [false, "Player already connected."];
        }

        for (const existingUsername of this.players.values()) {
            if (existingUsername === username) {
                return [false, "Player with that name already exists."];
            }
        }

        this.players.set(client, username);
        console.log("added player:", username);

        return [true, "Successfully added player."];
    }

    public removePlayer(player: WebSocket | string): void {
        if (typeof player === "string") {
            for (const [client, username] of this.players) {
                if (username === player) {
                    this.players.delete(client);
                    this.lastScans.delete(username);
                    console.log("removed player:", username);
                    return;
                }
            }
            return;
        }

        const username = this.players.get(player);

        if (this.players.delete(player)) {
            if (username !== undefined) {
                this.lastScans.delete(username);
            }

            console.log("removed player:", username);
        }
    }

    public getPlayers(): Map<WebSocket, string> {
        return this.players;
    }

    public getPlayerWebSocketByName(player: string): WebSocket | undefined {
        for (const [client, username] of this.players) {
            if (username === player) {
                return client;
            }
        }

        return undefined;
    }

    public getPlayerNameByWebSocket(socket: WebSocket): string | undefined {
        return this.players.get(socket);
    }

    public async validateImage(sender: string, image: Uint8Array): Promise<boolean> {
        try {
            const detected: boolean = await this.detector.containsPerson(image);

            if (!detected) {
                return false;
            }

            const lastScan = this.lastScans.get(sender);
            const now = Date.now();

            if (lastScan !== undefined && now - lastScan.getTime() < 30_000) {
                return false;
            }

            this.lastScans.set(sender, new Date(now));

            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}