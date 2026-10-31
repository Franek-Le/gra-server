import { Server } from "../server/server.js";
import { Game } from "../game/game.js";
import { u16 } from "../types/integers.js";


async function main(): Promise<void> {
    const server: Server = new Server(u16(55000));

    // @ts-ignore
    const game: Game = new Game(server);
}

setImmediate(main);