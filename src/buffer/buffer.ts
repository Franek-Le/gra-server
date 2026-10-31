import {
    i8, i16, i32, i64,
    u8, u16, u32, u64,
    type i8 as I8,
    type i16 as I16,
    type i32 as I32,
    type i64 as I64,
    type u8 as U8,
    type u16 as U16,
    type u32 as U32,
    type u64 as U64
} from "../types/integers.js";

export class Buffer {
    private data: ArrayBuffer;
    private view: DataView;
    private offset: I32;

    public constructor(capacity: I32 = i32(64)) {
        this.data = new ArrayBuffer(capacity);
        this.view = new DataView(this.data);
        this.offset = i32(0);
    }

    public get position(): I32 {
        return this.offset;
    }

    public get length(): I32 {
        return this.offset;
    }

    public reset(): void {
        this.offset = i32(0);
    }

    public writeI8(value: I8): void {
        this.ensureCapacity(i32(1));
        this.view.setInt8(this.offset, value);
        this.offset = i32(this.offset + 1);
    }

    public writeU8(value: U8): void {
        this.ensureCapacity(i32(1));
        this.view.setUint8(this.offset, value);
        this.offset = i32(this.offset + 1);
    }

    public writeI16(value: I16): void {
        this.ensureCapacity(i32(2));
        this.view.setInt16(this.offset, value, true);
        this.offset = i32(this.offset + 2);
    }

    public writeU16(value: U16): void {
        this.ensureCapacity(i32(2));
        this.view.setUint16(this.offset, value, true);
        this.offset = i32(this.offset + 2);
    }

    public writeI32(value: I32): void {
        this.ensureCapacity(i32(4));
        this.view.setInt32(this.offset, value, true);
        this.offset = i32(this.offset + 4);
    }

    public writeU32(value: U32): void {
        this.ensureCapacity(i32(4));
        this.view.setUint32(this.offset, value, true);
        this.offset = i32(this.offset + 4);
    }

    public writeI64(value: I64): void {
        this.ensureCapacity(i32(8));
        this.view.setBigInt64(this.offset, value, true);
        this.offset = i32(this.offset + 8);
    }

    public writeU64(value: U64): void {
        this.ensureCapacity(i32(8));
        this.view.setBigUint64(this.offset, value, true);
        this.offset = i32(this.offset + 8);
    }

    public readI8(): I8 {
        this.ensureAvailable(i32(1));
        const value = this.view.getInt8(this.offset);
        this.offset = i32(this.offset + 1);
        return i8(value);
    }

    public readU8(): U8 {
        this.ensureAvailable(i32(1));
        const value = this.view.getUint8(this.offset);
        this.offset = i32(this.offset + 1);
        return u8(value);
    }

    public readI16(): I16 {
        this.ensureAvailable(i32(2));
        const value = this.view.getInt16(this.offset, true);
        this.offset = i32(this.offset + 2);
        return i16(value);
    }

    public readU16(): U16 {
        this.ensureAvailable(i32(2));
        const value = this.view.getUint16(this.offset, true);
        this.offset = i32(this.offset + 2);
        return u16(value);
    }

    public readI32(): I32 {
        this.ensureAvailable(i32(4));
        const value = this.view.getInt32(this.offset, true);
        this.offset = i32(this.offset + 4);
        return i32(value);
    }

    public readU32(): U32 {
        this.ensureAvailable(i32(4));
        const value = this.view.getUint32(this.offset, true);
        this.offset = i32(this.offset + 4);
        return u32(value);
    }

    public readI64(): I64 {
        this.ensureAvailable(i32(8));
        const value = this.view.getBigInt64(this.offset, true);
        this.offset = i32(this.offset + 8);
        return i64(value);
    }

    public readU64(): U64 {
        this.ensureAvailable(i32(8));
        const value = this.view.getBigUint64(this.offset, true);
        this.offset = i32(this.offset + 8);
        return u64(value);
    }

    public writeBytes(value: Uint8Array): void {
        this.ensureCapacity(i32(value.byteLength));
        new Uint8Array(this.data).set(value, this.offset);
        this.offset = i32(this.offset + value.byteLength);
    }

    public readBytes(length: I32): Uint8Array {
        this.ensureAvailable(length);

        const value = new Uint8Array(this.data, this.offset, length);
        this.offset = i32(this.offset + length);

        return value;
    }

    public writeString(value: string): void {
        const bytes = new TextEncoder().encode(value);
        this.writeU32(u32(bytes.byteLength));
        this.writeBytes(bytes);
    }

    public readString(): string {
        const length = this.readU32();
        return new TextDecoder().decode(this.readBytes(i32(length)));
    }

    public writeBoolean(value: boolean): void {
        this.ensureCapacity(i32(1));
        this.view.setUint8(this.offset, value ? 1 : 0);
        this.offset = i32(this.offset + 1);
    }

    public readBoolean(): boolean {
        this.ensureAvailable(i32(1));
        const value = this.view.getUint8(this.offset);
        this.offset = i32(this.offset + 1);
        return value !== 0;
    }

    public writeStringArray(value: Array<string>): void {
        this.writeU32(u32(value.length));

        for (const item of value) {
            this.writeString(item);
        }
    }

    public readStringArray(): Array<string> {
        const length = this.readU32();
        const value = new Array<string>(length);

        for (let i = 0; i < length; i++) {
            value[i] = this.readString();
        }

        return value;
    }

    public writeStringU8Map(value: Map<string, u8>): void {
        this.writeU32(u32(value.size));

        for (const [key, item] of value) {
            this.writeString(key);
            this.writeU8(item);
        }
    }

    public readStringU8Map(): Map<string, u8> {
        const length = this.readU32();
        const value = new Map<string, u8>();

        for (let i = 0; i < length; i++) {
            const key = this.readString();
            const item = this.readU8();
            value.set(key, item);
        }

        return value;
    }

    public writeImage(bytes: Uint8Array): void {
        const length = i32(bytes.byteLength);
        this.writeI32(length)
        this.writeBytes(bytes)
    }

    public readImage(): Uint8Array {
        const length = this.readI32();
        return this.readBytes(length)
    }

    public toUint8Array(): Uint8Array {
        return new Uint8Array(this.data, 0, this.offset);
    }

    private ensureAvailable(length: I32): void {
        if (length < 0 || this.offset + length > this.data.byteLength) {
            throw new RangeError("Buffer underflow");
        }
    }

    private ensureCapacity(length: I32): void {
        const required = this.offset + length;

        if (required <= this.data.byteLength) {
            return;
        }

        let capacity = this.data.byteLength || 64;

        while (capacity < required) {
            capacity *= 2;
        }

        const data = new ArrayBuffer(capacity);
        new Uint8Array(data).set(new Uint8Array(this.data));

        this.data = data;
        this.view = new DataView(data);
    }
}