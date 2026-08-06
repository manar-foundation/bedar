#!/usr/bin/env node
/* ================================================================
   MIGRATE COLLECTION BODIES — bedar.webflow.io → src/content/

   Fetches every collection item listed in `collections.js`, parses
   the Webflow rich-text block out of the server-rendered HTML, and
   writes the result to `src/content/collection-bodies.js`.

   WHY A SCRIPT AND NOT COPY-PASTE
   ----------------------------------------------------------------
   Hand-transcribing ~13k characters of Arabic editorial prose is a
   silent-corruption risk: one dropped tashkeel or swapped quote mark
   and nobody notices until the client reads it. Generating the file
   makes the migration provably faithful, and re-runnable when the
   Webflow site changes before cutover.

   This is also the Phase 4 import step in miniature. When the
   Supabase schema lands, the same parser feeds the seed script —
   only the write target changes.

   OUTPUT SHAPE — blocks, not HTML strings. Dashboard-authored
   content rendered through `dangerouslySetInnerHTML` makes every
   editor account an XSS vector; `RichText` renders these blocks as
   real React elements instead.

   Usage:
     node scripts/migrate-bodies.mjs           # write the file
     node scripts/migrate-bodies.mjs --dry-run # print a summary only
   ================================================================ */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ORIGIN = 'https://bedar.webflow.io';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/content/collection-bodies.js');

/* Items to migrate. Paths are the live site's, which mixes
   /programs/:slug and /program/:slug — see collections.js. */
const ITEMS = [
  ['articles', 'stages-of-idea-generation', '/blog/stages-of-idea-generation'],
  ['articles', 'an-idea-equals-profits', '/blog/an-idea-equals-profits'],
  ['articles', 'refining-ideas', '/blog/refining-ideas'],
  ['articles', 'become-like-those-successful-people', '/blog/become-like-those-successful-people'],
  ['news', 'gaza-hackathon-launch', '/news/gaza-hackathon-launch'],
  ['news', 'hackathon-press-release', '/news/hackathon-press-release'],
  ['programs', 'hackathon', '/programs/hackathon'],
  ['programs', 'community-solutions-challenge', '/program/community-solutions-challenge'],
  ['programs', 'bedar-second-entrepreneurial-program', '/program/bedar-second-entrepreneurial-program'],
];

const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

const decode = (text) =>
  text
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

/** Strip inline tags (<em>, <strong>, <a>, <br>) and collapse space. */
const toText = (html) =>
  decode(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Slice out the element that starts at `openIndex`, counting nested
 * <div> so a figure or embed inside the rich text does not end the
 * capture early.
 */
function sliceElement(html, openIndex) {
  const tagEnd = html.indexOf('>', openIndex);
  let depth = 1;
  let cursor = tagEnd + 1;
  const start = cursor;

  while (depth > 0 && cursor < html.length) {
    const nextOpen = html.indexOf('<div', cursor);
    const nextClose = html.indexOf('</div>', cursor);
    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) return html.slice(start, nextClose);
      cursor = nextClose + 6;
    }
  }
  return html.slice(start, cursor);
}

/** Parse the rich-text inner HTML into the block list RichText renders. */
function parseBlocks(inner) {
  const blocks = [];
  const pattern = /<(p|h2|h3|h4|blockquote|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  for (const match of inner.matchAll(pattern)) {
    const tag = match[1].toLowerCase();
    const body = match[2];

    if (tag === 'ul' || tag === 'ol') {
      const items = [...body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((li) => toText(li[1]))
        .filter(Boolean);
      if (items.length) blocks.push({ type: 'ul', items });
      continue;
    }

    const text = toText(body);
    if (!text) continue;

    if (tag === 'blockquote') blocks.push({ type: 'quote', text });
    else if (tag === 'h2') blocks.push({ type: 'h2', text });
    else if (tag === 'h3' || tag === 'h4') blocks.push({ type: 'h3', text });
    else blocks.push({ type: 'p', text });
  }

  return blocks;
}

/**
 * Fallback for items that are NOT rich-text CMS entries.
 *
 * `/programs/hackathon` is a bespoke Webflow landing page — six
 * designed sections (hero, goals, who can join, specialisms, a dated
 * timeline) with no `w-richtext` block anywhere. Its prose is still
 * migrated here, in document order, so nothing is lost.
 *
 * What this CANNOT preserve is the page's structure: the timeline
 * flattens into headings and paragraphs. That layout is a page-build
 * job, not a content-migration one — see the README note.
 */
function parsePageProse(html) {
  // Trim to the content between the page's <h1> and the footer, so
  // navbar links and footer columns never become article
  // paragraphs. Boundaries are anchored on the <h1> and the footer's
  // class rather than on <section>: this page wraps its sections in
  // `<div class="section …">`, so a tag-name anchor finds nothing.
  const start = html.search(/<h1\b/i);
  const end = html.search(/class="[^"]*\bfooter\b[^"]*"/i);
  if (start === -1) return [];

  const main = html.slice(start, end === -1 ? undefined : end);
  const blocks = [];
  const pattern = /<(h1|h2|h3|h4|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  for (const match of main.matchAll(pattern)) {
    const tag = match[1].toLowerCase();
    const text = toText(match[2]);
    if (!text) continue;

    // The <h1> is the item title, already on the record.
    if (tag === 'h1') continue;
    if (tag === 'h2') blocks.push({ type: 'h2', text });
    else if (tag === 'h3' || tag === 'h4') blocks.push({ type: 'h3', text });
    else blocks.push({ type: 'p', text });
  }

  // Drop consecutive duplicates — Webflow renders some headings
  // twice for its desktop/mobile breakpoints.
  return blocks.filter(
    (block, index, all) => index === 0 || block.text !== all[index - 1].text,
  );
}

async function fetchBody(path) {
  const response = await fetch(`${ORIGIN}${path}`, {
    headers: { 'user-agent': 'bedar-migration/1.0' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const html = await response.text();
  const openIndex = html.search(/<div[^>]*class="[^"]*w-richtext[^"]*"[^>]*>/i);

  return openIndex === -1
    ? parsePageProse(html)
    : parseBlocks(sliceElement(html, openIndex));
}

const HEADER = `/* ================================================================
   COLLECTION BODIES — GENERATED FILE, DO NOT EDIT BY HAND.

   Produced by \`scripts/migrate-bodies.mjs\` from bedar.webflow.io.
   Regenerate with:

     node scripts/migrate-bodies.mjs

   These are the long-form bodies for the \`articles\`, \`news\` and
   \`programs\` collections, keyed by slug. \`collections.js\` attaches
   them, so the collection shape stays exactly what Supabase will
   serve in Phase 4 — at which point this file is deleted and the
   same parser seeds the database instead.
   ================================================================ */

`;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const bodies = {};
  let failures = 0;

  for (const [collection, slug, path] of ITEMS) {
    try {
      const blocks = await fetchBody(path);
      bodies[slug] = blocks;
      const words = blocks.reduce(
        (total, block) => total + (block.text ?? (block.items ?? []).join(' ')).split(/\s+/).length,
        0,
      );
      console.log(
        `  ${blocks.length ? '✓' : '·'} ${collection}/${slug} — ${blocks.length} blocks, ~${words} words`,
      );
    } catch (error) {
      failures += 1;
      bodies[slug] = [];
      console.error(`  ✗ ${collection}/${slug} — ${error.message}`);
    }
  }

  if (dryRun) {
    console.log('\n--dry-run: nothing written.');
    return;
  }

  const file = `${HEADER}export const bodies = ${JSON.stringify(bodies, null, 2)};\n\nexport default bodies;\n`;
  await writeFile(OUT, file, 'utf8');
  console.log(`\nWrote ${OUT}`);
  if (failures) {
    console.error(`${failures} item(s) failed — those bodies are empty.`);
    process.exitCode = 1;
  }
}

main();
