export type i8 = number & { readonly __i8: unique symbol };
export type u8 = number & { readonly __u8: unique symbol };

export type i16 = number & { readonly __i16: unique symbol };
export type u16 = number & { readonly __u16: unique symbol };

export type i32 = number & { readonly __i32: unique symbol };
export type u32 = number & { readonly __u32: unique symbol };

export type i64 = bigint & { readonly __i64: unique symbol };
export type u64 = bigint & { readonly __u64: unique symbol };

export type i128 = bigint & { readonly __i128: unique symbol };
export type u128 = bigint & { readonly __u128: unique symbol };

function int(value: number, min: number, max: number): number {
    if (!Number.isInteger(value)) throw new RangeError(`Expected integer, got ${value}`);
    if (value < min || value > max) throw new RangeError(`Integer ${value} is outside range ${min}..${max}`);
    return value;
}

function uint(value: number, max: number): number {
    return int(value, 0, max);
}

function bigintInt(value: bigint, min: bigint, max: bigint): bigint {
    if (value < min || value > max) throw new RangeError(`Integer ${value} is outside range ${min}..${max}`);
    return value;
}

export function i8(value: number): i8 {
    return int(value, -128, 127) as i8;
}

export function u8(value: number): u8 {
    return uint(value, 255) as u8;
}

export function i16(value: number): i16 {
    return int(value, -32_768, 32_767) as i16;
}

export function u16(value: number): u16 {
    return uint(value, 65_535) as u16;
}

export function i32(value: number): i32 {
    return int(value, -2_147_483_648, 2_147_483_647) as i32;
}

export function u32(value: number): u32 {
    return uint(value, 4_294_967_295) as u32;
}

export function i64(value: bigint): i64 {
    return bigintInt(value, -(2n ** 63n), 2n ** 63n - 1n) as i64;
}

export function u64(value: bigint): u64 {
    return bigintInt(value, 0n, 2n ** 64n - 1n) as u64;
}

export function i128(value: bigint): i128 {
    return bigintInt(value, -(2n ** 127n), 2n ** 127n - 1n) as i128;
}

export function u128(value: bigint): u128 {
    return bigintInt(value, 0n, 2n ** 128n - 1n) as u128;
}