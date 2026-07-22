// Turns the supplied brand icon (black-on-white PNG) into a tight CSS-mask PNG:
// the flask shape lives in the ALPHA channel (transparent background), so it
// tints to the palette like the wordmark. Run: node scripts/process-mark.mjs
//
// Uses threshold -> unflatten (white pixels become transparent) which is robust
// for a 2-colour logo, then trims to a tight bounding box.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src/assets/mark-source.png'); // the original hi-res icon

const buf = await sharp(src)
  .flatten({ background: '#ffffff' }) // drop any source alpha, force white bg
  .threshold(210) // crisp black/white so edges unflatten cleanly
  .unflatten() // white -> transparent  (black flask stays opaque)
  .trim({ threshold: 10 }) // crop the transparent margin to a tight bbox
  .resize({ width: 600, height: 600, fit: 'inside' })
  .png()
  .toBuffer({ resolveWithObject: true });

writeFileSync(join(root, 'src/assets/mark.png'), buf.data);

const m = await sharp(buf.data).metadata();
console.log(`mark.png ${m.width}x${m.height} ch=${m.channels} alpha=${m.hasAlpha} aspect=${(m.width / m.height).toFixed(3)}`);
