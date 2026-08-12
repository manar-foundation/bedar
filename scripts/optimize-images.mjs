#!/usr/bin/env node
/* ================================================================
   OPTIMIZE IMAGES — re-encode the bundled raster photography to
   WebP at the size it is actually displayed.

   WHY THIS IS A SCRIPT AND NOT A BUILD PLUGIN
   ----------------------------------------------------------------
   Same reasoning as `migrate-bodies.mjs`: the inputs are a fixed set
   of files that change when a designer hands over new artwork, not
   on every build. A build-time image plugin would re-encode seven
   photographs on every `npm run build` and on every cold dev start,
   to produce bytes that are identical each time. Running it once and
   committing the result keeps the build fast and makes the shipped
   bytes reviewable in a diff.

   WHAT IT DOES
   ----------------------------------------------------------------
   The service photographs were 1200×900 JPEGs — 1.0 MB for the set —
   rendered into a `aspect-[16/10]` frame that is at most ~560 CSS px
   wide on this layout (a three-column grid inside a 1280px
   container). So every visitor to /services was downloading roughly
   four times the pixels they could see, in a format ~30% larger than
   WebP at the same quality.

   Two passes, both lossy and both safe for photography:

     resize   to `MAX_WIDTH`, which is 2× the largest CSS width the
              layout ever gives them, so the images stay sharp on a
              2× display and stop there. `withoutEnlargement` so a
              smaller source is never upscaled into a bigger file.
     encode   WebP at quality 78. Below ~72 the teal grading in these
              photographs starts to band in the sky areas; 78 is the
              first step where a side-by-side is clean.

   Run it after dropping new artwork in:

       node scripts/optimize-images.mjs
       node scripts/optimize-images.mjs --dry-run

   It writes a `.webp` beside each source and leaves the source in
   place — the JPEGs stay in the repo as the masters to re-encode
   from, and nothing imports them once the components point at the
   `.webp`.
   ================================================================ */

import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Directories walked for raster sources, relative to the repo root. */
const SOURCE_DIRS = ['src/assets/services', 'src/assets/images'];

const RASTER = new Set(['.jpg', '.jpeg', '.png']);

/* 2× the widest CSS box the layout gives these photographs. The
   services grid is three columns inside a 1280px container, so one
   card's media frame tops out near 400px; on a phone it is the full
   container width, ~360px. 1100 covers both at 2× with headroom. */
const MAX_WIDTH = 1100;
const QUALITY = 78;

const dryRun = process.argv.includes('--dry-run');

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} kB`;

async function convert(file) {
  const out = join(dirname(file), `${basename(file, extname(file))}.webp`);
  const before = (await stat(file)).size;

  const pipeline = sharp(file)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY });

  if (dryRun) {
    const buffer = await pipeline.toBuffer();
    return { out, before, after: buffer.length };
  }

  const info = await pipeline.toFile(out);
  return { out, before, after: info.size };
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  for (const dir of SOURCE_DIRS) {
    const absolute = join(ROOT, dir);
    let entries;
    try {
      entries = await readdir(absolute);
    } catch {
      continue; // an empty or absent asset folder is not an error
    }

    for (const entry of entries) {
      if (!RASTER.has(extname(entry).toLowerCase())) continue;

      const { out, before, after } = await convert(join(absolute, entry));
      const saved = (((before - after) / before) * 100).toFixed(0);
      console.log(
        `  ${entry.padEnd(34)} ${kb(before).padStart(8)} → ${kb(after).padStart(8)}  (-${saved}%)`,
      );

      totalBefore += before;
      totalAfter += after;
      count += 1;
      void out;
    }
  }

  if (count === 0) {
    console.log('No raster sources found.');
    return;
  }

  console.log(
    `\n${count} image(s): ${kb(totalBefore)} → ${kb(totalAfter)} ` +
      `(-${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0)}%)` +
      `${dryRun ? '  [dry run — nothing written]' : ''}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
