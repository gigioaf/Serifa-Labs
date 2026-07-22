// Generates the brand raster/vector assets from the flask mark + wordmark:
//   public/og-image.png       1200x630  flask + wordmark on --shaft   (OG/Twitter)
//   public/logo-serifa.png    512x512   flask (rock) on --shaft       (JSON-LD logo)
//   public/favicon.png        512x512   flask (barley-l) on --shaft
//   public/apple-touch-icon.png 180x180 same as favicon
//   public/favicon.svg        scalable  flask tinted on a rounded --shaft tile
//
// Run:  npm run gen:assets   (needs src/assets/mark.png + logo.png)
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const asset = (p) => join(root, 'src/assets', p);
const out = (p) => join(root, 'public', p);

const SHAFT = '#2D2D2D';
const ROCK = '#EAE0D2';
const BARLEY_L = '#C4A47C';

// Recolour a mask PNG (shape in its alpha channel) to a flat colour, keeping the
// original alpha. Works for both mark.png (flask) and logo.png (wordmark).
async function tint(srcPath, hex) {
  const meta = await sharp(srcPath).metadata();
  const alpha = await sharp(srcPath).ensureAlpha().extractChannel(3).toColourspace('b-w').png().toBuffer();
  return sharp({ create: { width: meta.width, height: meta.height, channels: 3, background: hex } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

async function onShaft(width, height, markBuffer, markWidth) {
  const mark = await sharp(markBuffer).resize({ width: markWidth }).toBuffer();
  return sharp({ create: { width, height, channels: 4, background: SHAFT } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toBuffer();
}

const wordmarkRock = await tint(asset('logo.png'), ROCK);
const markRock = await tint(asset('mark.png'), ROCK);
const markBarley = await tint(asset('mark.png'), BARLEY_L);

// og-image — flask above the wordmark, on shaft
const ogFlask = await sharp(markRock).resize({ height: 210 }).toBuffer();
const ogWord = await sharp(wordmarkRock).resize({ width: 640 }).toBuffer();
const ogFlaskW = (await sharp(ogFlask).metadata()).width;
const ogWordW = (await sharp(ogWord).metadata()).width;
const ogImage = await sharp({ create: { width: 1200, height: 630, channels: 4, background: SHAFT } })
  .composite([
    { input: ogFlask, left: Math.round((1200 - ogFlaskW) / 2), top: 140 },
    { input: ogWord, left: Math.round((1200 - ogWordW) / 2), top: 400 },
  ])
  .png()
  .toBuffer();
writeFileSync(out('og-image.png'), ogImage);

// JSON-LD / brand logo — flask on shaft, square (icon-like)
writeFileSync(out('logo-serifa.png'), await onShaft(512, 512, markRock, 300));

// favicon + apple touch — flask (barley-l) on shaft
const faviconPng = await onShaft(512, 512, markBarley, 300);
writeFileSync(out('favicon.png'), faviconPng);
writeFileSync(out('apple-touch-icon.png'), await sharp(faviconPng).resize(180, 180).png().toBuffer());

// favicon.svg — scalable: rounded shaft tile + the flask tinted via feColorMatrix.
// Embed a small raster of the mask so the SVG stays light.
const [br, bg, bb] = [0xc4, 0xa4, 0x7c].map((v) => (v / 255).toFixed(4));
const markSmall = (await sharp(asset('mark.png')).resize({ width: 160 }).png().toBuffer()).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="${SHAFT}"/>
  <defs>
    <filter id="t" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0 0 0 0 ${br}  0 0 0 0 ${bg}  0 0 0 0 ${bb}  0 0 0 1 0"/>
    </filter>
  </defs>
  <image x="16" y="14" width="32" height="36" preserveAspectRatio="xMidYMid meet"
         filter="url(#t)" href="data:image/png;base64,${markSmall}"/>
</svg>
`;
writeFileSync(out('favicon.svg'), svg);

console.log('Generated from flask mark: og-image.png, logo-serifa.png, favicon.png, apple-touch-icon.png, favicon.svg');
