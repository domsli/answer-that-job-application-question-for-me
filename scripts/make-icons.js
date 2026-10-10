import { crc32, deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "icons");
mkdirSync(root, { recursive: true });

for (const size of [16, 48, 128]) {
  writeFileSync(join(root, `icon${size}.png`), png(draw(size)));
}

function draw(size) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const color = sample(x + 0.5, y + 0.5, size);
      const index = (y * size + x) * 4;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      pixels[index + 3] = color[3];
    }
  }
  return { size, pixels };
}

function sample(x, y, size) {
  const page = roundedRect(x, y, size * 0.16, size * 0.1, size * 0.78, size * 0.8, size * 0.12);
  const fold = pointInPolygon(x, y, [
    [size * 0.62, size * 0.1],
    [size * 0.94, size * 0.1],
    [size * 0.94, size * 0.4],
  ]);
  const sheet = page && !fold;
  if (sheet) {
    const line = (top) => x > size * 0.3 && x < size * 0.7 && y > size * top && y < size * top + Math.max(2, size * 0.045);
    if (line(0.38) || line(0.5) || line(0.62)) return [14, 107, 82, 255];
    return [255, 252, 247, 255];
  }
  if (fold) return [232, 196, 138, 255];
  if (roundedRect(x, y, size * 0.08, size * 0.04, size * 0.84, size * 0.92, size * 0.18)) return [14, 107, 82, 255];
  return [0, 0, 0, 0];
}

function roundedRect(x, y, left, top, width, height, radius) {
  const dx = Math.abs(x - (left + width / 2)) - (width / 2 - radius);
  const dy = Math.abs(y - (top + height / 2)) - (height / 2 - radius);
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) <= radius;
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function png({ size, pixels }) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * size * 4, size * 4).copy(raw, row + 1);
  }
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])) >>> 0);
  return Buffer.concat([length, name, data, checksum]);
}
