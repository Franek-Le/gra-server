import type {i32, u16, u32, u8} from "../types/integers.js";

export type MovementPacketData = {
    tick: u32;
    lat: i32, // lat_e7 = degrees * 10,000,000
    lon: i32, // lon_e7 = degrees * 10,000,000
    accuracy: u8, // meters
    speed: u16, // cm/s
};

export type ConnectPacketData = {
    username: string,
};

export type DisconnectPacketData = {};

export type StartPacketData = {
    duration: u8
};

export type EndPacketData = {}

export type ImagePacketData = {
    data: Uint8Array,
};

export type PacketData = ConnectPacketData | DisconnectPacketData | StartPacketData | ImagePacketData | EndPacketData;

export type Packet = {
    version: u8;
    type: u8;
    timestamp: u32;
    payload_len: u16;
    payload: PacketData;
}