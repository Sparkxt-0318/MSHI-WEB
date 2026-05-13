// Sweep a vertical line through the canvas to find where the sphere is.
import { promises as fs } from 'node:fs';
import { PNG } from 'pngjs';
const png = PNG.sync.read(await fs.readFile(process.argv[2]));
const W = png.width, H = png.height, data = png.data;
const samples = [];
for (let y = 0; y < H; y += 30) {
  const i = (y * W + Math.floor(W / 2)) * 4;
  samples.push({ y, r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] });
}
console.log(JSON.stringify(samples, null, 2));
