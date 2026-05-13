// Sample a horizontal line through y=450 (sphere mid) to find sphere edges
// and any halo.
import { promises as fs } from 'node:fs';
import { PNG } from 'pngjs';
const png = PNG.sync.read(await fs.readFile(process.argv[2]));
const W = png.width, data = png.data;
const y = 450;
const samples = [];
for (let x = 0; x < W; x += 20) {
  const i = (y * W + x) * 4;
  samples.push({ x, r: data[i], g: data[i+1], b: data[i+2] });
}
console.log(JSON.stringify(samples.filter(s => s.r > 30 || s.g > 30 || s.b > 30), null, 2));
