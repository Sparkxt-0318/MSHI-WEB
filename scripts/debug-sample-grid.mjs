// Sample a 5x5 grid across the canvas to see where the sphere is.
import { promises as fs } from 'node:fs';
import { PNG } from 'pngjs';
const png = PNG.sync.read(await fs.readFile(process.argv[2]));
const W = png.width, H = png.height, data = png.data;
const rows = 9, cols = 9;
const grid = [];
for (let r = 0; r < rows; r++) {
  const row = [];
  for (let c = 0; c < cols; c++) {
    const x = Math.floor((c + 0.5) * W / cols);
    const y = Math.floor((r + 0.5) * H / rows);
    const i = (y * W + x) * 4;
    row.push(`${data[i].toString().padStart(3)},${data[i+1].toString().padStart(3)},${data[i+2].toString().padStart(3)}`);
  }
  grid.push(row.join(' | '));
}
console.log(grid.join('\n'));
