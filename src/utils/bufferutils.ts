export function uint64LE(x: number): Buffer {
  const buffer = Buffer.alloc(8);
  writeUInt64LE(buffer, x, 0);
  return buffer;
}

// Copyright (c) 2011-2020 bitcoinjs-lib contributors (MIT License).
// Taken from https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/bufferutils.ts#L26-L36
export function writeUInt64LE(
  buffer: Buffer,
  value: number,
  offset: number
): number {
  verifuint(value, 0x001fffffffffffff);

  buffer.writeInt32LE(value & -1, offset);
  buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4);
  return offset + 8;
}

// https://github.com/feross/buffer/blob/master/index.js#L1127
function verifuint(value: number, max: number): void {
  if (typeof value !== 'number')
    throw new Error('cannot write a non-number as a number');
  if (value < 0)
    throw new Error('specified a negative value for writing an unsigned value');
  if (value > max) throw new Error('RangeError: value out of range');
  if (Math.floor(value) !== value)
    throw new Error('value has a fractional component');
}
