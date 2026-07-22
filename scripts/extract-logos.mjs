// Extracts the two base64 PNG logos embedded in the source HTML (--logo and
// --logo-s CSS variables) into real files under src/assets/. Run once:
//   node scripts/extract-logos.mjs
// Also prints each PNG's IHDR (dimensions, bit depth, colour type) so we can
// choose the right favicon / og-image tinting strategy.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'serifa-lab_12.html'), 'utf8');

function grab(varName) {
  const re = new RegExp(`${varName}\\s*:\\s*url\\("data:image/png;base64,([^"]+)"\\)`);
  const m = html.match(re);
  if (!m) throw new Error(`Could not find ${varName} data URI`);
  return Buffer.from(m[1], 'base64');
}

function ihdr(buf) {
  // PNG signature is 8 bytes, then IHDR chunk: 4 len + 4 type + data.
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf.readUInt8(24);
  const colorType = buf.readUInt8(25); // 6 = RGBA, 4 = grey+alpha, 3 = palette, 2 = RGB, 0 = grey
  const types = { 0: 'grey', 2: 'RGB', 3: 'palette', 4: 'grey+alpha', 6: 'RGBA' };
  return { width, height, bitDepth, colorType: `${colorType} (${types[colorType] ?? '?'})` };
}

const wordmark = grab('--logo');
const sMark = grab('--logo-s');

writeFileSync(join(root, 'src/assets/logo.png'), wordmark);
writeFileSync(join(root, 'src/assets/logo-s.png'), sMark);

console.log('logo.png   ', wordmark.length, 'bytes', JSON.stringify(ihdr(wordmark)));
console.log('logo-s.png ', sMark.length, 'bytes', JSON.stringify(ihdr(sMark)));
