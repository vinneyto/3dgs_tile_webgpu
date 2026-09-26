import { Buffer } from "node:buffer";

const BUFFER_MARKER = "$gaussianArrayBuffer";
export const DEFAULT_MAX_FRAME_BYTES = 1024 * 1024 * 1024;

/** JSON metadata and raw binary attachments; no class instances enter the wire format. */
export function encodeFrame(message, maxFrameBytes = DEFAULT_MAX_FRAME_BYTES) {
  const attachments = [];
  const attachmentIndices = new Map();
  const metadata = JSON.stringify(message, (_key, value) => {
    if (value instanceof ArrayBuffer) {
      let index = attachmentIndices.get(value);
      if (index === undefined) {
        index = attachments.length;
        attachmentIndices.set(value, index);
        attachments.push(Buffer.from(value));
      }
      return { [BUFFER_MARKER]: index };
    }
    if (ArrayBuffer.isView(value))
      throw new TypeError("Wire messages must use ArrayBuffer, not typed-array views");
    return value;
  });
  const json = Buffer.from(metadata, "utf8");
  const bodySize = 8 + json.length + attachments.reduce((sum, part) => sum + 4 + part.length, 0);
  if (bodySize > maxFrameBytes || bodySize > 0xffffffff)
    throw new RangeError("Gaussian backend frame exceeds the configured limit");
  const frame = Buffer.allocUnsafe(bodySize + 4);
  frame.writeUInt32BE(bodySize, 0);
  frame.writeUInt32BE(json.length, 4);
  frame.writeUInt32BE(attachments.length, 8);
  let offset = 12;
  json.copy(frame, offset);
  offset += json.length;
  for (const part of attachments) {
    frame.writeUInt32BE(part.length, offset);
    offset += 4;
    part.copy(frame, offset);
    offset += part.length;
  }
  return frame;
}

export function decodeFrame(frame) {
  if (frame.length < 8) throw new Error("Truncated Gaussian backend frame");
  const jsonSize = frame.readUInt32BE(0);
  const attachmentCount = frame.readUInt32BE(4);
  if (jsonSize > frame.length - 8) throw new Error("Invalid Gaussian backend JSON length");
  let offset = 8 + jsonSize;
  const attachments = [];
  for (let index = 0; index < attachmentCount; index++) {
    if (offset + 4 > frame.length) throw new Error("Truncated Gaussian backend attachment");
    const size = frame.readUInt32BE(offset);
    offset += 4;
    if (size > frame.length - offset) throw new Error("Invalid Gaussian backend attachment length");
    attachments.push(Uint8Array.from(frame.subarray(offset, offset + size)).buffer);
    offset += size;
  }
  if (offset !== frame.length) throw new Error("Unexpected trailing Gaussian backend data");
  return JSON.parse(frame.toString("utf8", 8, 8 + jsonSize), (_key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value) &&
      Object.keys(value).length === 1 && Object.hasOwn(value, BUFFER_MARKER)) {
      const index = value[BUFFER_MARKER];
      if (!Number.isSafeInteger(index) || !attachments[index])
        throw new Error("Invalid Gaussian backend attachment reference");
      return attachments[index];
    }
    return value;
  });
}

/** Length-prefixed TCP stream parser, including fragmented and coalesced packets. */
export class FrameReader {
  #chunks = [];
  #available = 0;
  #expected = null;
  #maxFrameBytes;

  constructor(maxFrameBytes = DEFAULT_MAX_FRAME_BYTES) {
    this.#maxFrameBytes = maxFrameBytes;
  }

  push(chunk) {
    if (chunk.length) {
      this.#chunks.push(chunk);
      this.#available += chunk.length;
    }
    const messages = [];
    while (true) {
      if (this.#expected === null) {
        if (this.#available < 4) break;
        this.#expected = this.#read(4).readUInt32BE(0);
        if (this.#expected > this.#maxFrameBytes || this.#expected < 8)
          throw new RangeError("Invalid Gaussian backend frame length");
      }
      if (this.#available < this.#expected) break;
      messages.push(decodeFrame(this.#read(this.#expected)));
      this.#expected = null;
    }
    return messages;
  }

  #read(length) {
    const out = Buffer.allocUnsafe(length);
    let offset = 0;
    while (offset < length) {
      const chunk = this.#chunks[0];
      const count = Math.min(chunk.length, length - offset);
      chunk.copy(out, offset, 0, count);
      offset += count;
      this.#available -= count;
      if (count === chunk.length) this.#chunks.shift();
      else this.#chunks[0] = chunk.subarray(count);
    }
    return out;
  }
}
