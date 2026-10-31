import type {u16, u32, u8} from "../types/integers.js";

export type GameStartServerPacketData = {};

export type GameEndServerPacketData = {
    leaderboard: Map<string, u8>
}

export type GameConnectResultServerPacketData = {
    success: boolean,
    message: string,
    players: Array<string>
}

export type GamePlayerListUpdateServerPacketData = {
    players: Array<string>
}

export type GameImageScanResultPacketData = {
    success: boolean
}

export type ServerPacketData = GameStartServerPacketData | GameEndServerPacketData | GameConnectResultServerPacketData | GamePlayerListUpdateServerPacketData | GameImageScanResultPacketData;

export type ServerPacket = {
    version: u8;
    type: u8;
    timestamp: u32;
    payload_len: u16;
    payload: ServerPacketData;
}