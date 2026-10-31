import type {
    GameConnectResultServerPacketData,
    GameEndServerPacketData, GameImageScanResultPacketData, GamePlayerListUpdateServerPacketData,
    ServerPacket,
    ServerPacketData
} from "./server-packet.js";

import { i32, type u8 } from "../types/integers.js";
import { Buffer } from "../buffer/buffer.js";

export class ServerPacketSerializer {
    public static serialize(packet: ServerPacket): Buffer {
        const buffer: Buffer = new Buffer(i32(16 + packet.payload_len));

        buffer.writeU8(packet.version);
        buffer.writeU8(packet.type);
        buffer.writeU32(packet.timestamp);
        buffer.writeU16(packet.payload_len);
        this.serializePayload(packet.type, packet.payload, buffer);

        return buffer;
    }

    private static serializePayload(type: u8, payload: ServerPacketData, buffer: Buffer): void {
        switch (type) {
            case 0x00:
                break;

            case 0x01:
                const gameEndPacketData = payload as GameEndServerPacketData;
                buffer.writeStringU8Map(gameEndPacketData.leaderboard);
                break;

            case 0x02:
                const serverGameConnectResultPacketData = payload as GameConnectResultServerPacketData;
                buffer.writeBoolean(serverGameConnectResultPacketData.success);
                buffer.writeString(serverGameConnectResultPacketData.message);
                buffer.writeStringArray(serverGameConnectResultPacketData.players);
                break;

            case 0x03:
                const gamePlayerListUpdateServerPacketData = payload as GamePlayerListUpdateServerPacketData;
                buffer.writeStringArray(gamePlayerListUpdateServerPacketData.players);
                break;

            case 0x04:
                const gameImageScanResultPacketData = payload as GameImageScanResultPacketData;
                buffer.writeBoolean(gameImageScanResultPacketData.success)
                break;
        }
    }
}