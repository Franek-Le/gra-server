import { u8 } from "../types/integers.js";

export class PointManager {
    private readonly points: Map<string, u8>;

    public constructor(players: Array<string>) {
        this.points = new Map<string, u8>()

        players.forEach((player: string) => {
            this.points.set(player, u8(0));
        })
    }

    public addPoints(player: string, points: u8) {
        if (!this.points.has(player)) {
            this.points.set(player, points);
            return;
        }

        const currentPoints: u8 = this.points.get(player)!;
        this.points.set(player, u8(currentPoints + points));

        console.log(`Added ${points} points to ${player}`);
    }

    public getWinner(): string {
        let winner: string = "";
        let mostPoints = 0;

        this.points.forEach((value: u8, player: string)=> {
            if (value > mostPoints) {
                winner = player;
                mostPoints = value;
            }
        });

        return winner;
    }

    public getLeaderboard(): Map<string, u8> {
        return this.points;
    }
}