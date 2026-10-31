import type {
    ConnectPacketData,
    DisconnectPacketData,
    Packet,
    PacketData,
    ImagePacketData,
    StartPacketData, EndPacketData
} from "./packet.js";
import { Buffer } from "../buffer/buffer.js";

import {i32, type u16, type u32, type u8} from "../types/integers.js";

export class PacketFactory {
    public constructor() {

    }

    public static createPacket(bytes: Uint8Array): Packet {
        const buffer = new Buffer(i32(bytes.byteLength));
        buffer.writeBytes(bytes);
        buffer.reset();

        const version: u8 = buffer.readU8();
        const type: u8 = buffer.readU8();
        const timestamp: u32 = buffer.readU32();
        const payload_len: u16 = buffer.readU16();
        let data:  PacketData = this.deserializePacketData(type, buffer);

        return {
            version: version,
            type: type,
            timestamp: timestamp,
            payload_len: payload_len,
            payload: data,
        } as Packet;
    }

    private static deserializePacketData(type: u8, buffer: Buffer): PacketData {
        switch (type) {
            case 0x00:
                return {
                    username: buffer.readString()
                } as ConnectPacketData;

            case 0x01:
                return {} as DisconnectPacketData;

            case 0x02:
                return {
                    duration: buffer.readU8()
                } as StartPacketData;

            case 0x03:
                return {
                    data: buffer.readImage()
                } as ImagePacketData;

            case 0x04:
                return {} as EndPacketData;
        }

        return {};
    }
}