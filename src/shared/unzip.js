const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

function findEocd(view) {
  const length = view.byteLength;
  if (length < 22) return -1;
  const start = Math.max(0, length - 22 - 0xffff);
  for (let offset = length - 22; offset >= start; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  return -1;
}

function readLocal(bytes, view, localOffset, compressedSize) {
  if (localOffset + 30 > view.byteLength) {
    throw new Error("This file's zip data is incomplete.");
  }
  if (view.getUint32(localOffset, true) !== LOCAL_SIGNATURE) {
    throw new Error("This file's zip data is damaged.");
  }
  const nameLength = view.getUint16(localOffset + 26, true);
  const extraLength = view.getUint16(localOffset + 28, true);
  const start = localOffset + 30 + nameLength + extraLength;
  const end = start + compressedSize;
  if (end > bytes.length) throw new Error("This file's zip data is incomplete.");
  return bytes.subarray(start, end);
}

export async function unzipEntries(buffer, inflateRaw) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEocd(view);
  if (eocd < 0) throw new Error("That file is not a valid DOCX document.");

  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  if (offset === 0xffffffff) {
    throw new Error("This DOCX uses a zip format this extension cannot read. Paste the text instead.");
  }

  const entries = [];
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      throw new Error("That DOCX file looks damaged.");
    }
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const nameStart = offset + 46;
    const name = new TextDecoder("utf-8").decode(bytes.subarray(nameStart, nameStart + nameLength));

    if (flags & 1) throw new Error("Password-protected documents are not supported.");
    if (localOffset === 0xffffffff || compressedSize === 0xffffffff) {
      throw new Error("This DOCX uses a zip format this extension cannot read. Paste the text instead.");
    }

    if (!name.endsWith("/")) {
      const compressed = readLocal(bytes, view, localOffset, compressedSize);
      let data = compressed;
      if (method === 8) {
        data = await inflateRaw(compressed);
        if (!(data instanceof Uint8Array)) data = new Uint8Array(data);
      } else if (method !== 0) {
        throw new Error(`Couldn't read ${name} from that document.`);
      }
      entries.push({ name: name.replace(/\\/g, "/"), data });
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
