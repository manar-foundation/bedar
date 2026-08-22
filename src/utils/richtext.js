/* ================================================================
   THE RICH-TEXT BLOCK MODEL — one source for the editor and the
   renderer.

   Client note ١ replaced the old per-paragraph section editor with a
   single Rich Text field: one box where a writer types the article
   and marks up subheadings, quotes, lists and images as they go,
   instead of creating a numbered "section" per paragraph and picking
   its type from a dropdown.

   WHAT DID NOT CHANGE, AND WHY
   ----------------------------------------------------------------
   What is STORED is still a block array in jsonb, never an HTML
   string. That rule is not stylistic (CLAUDE.md, "Supabase schema
   rules"): an HTML string authored in the dashboard has to come back
   through `dangerouslySetInnerHTML`, which makes every editor account
   an XSS vector — and RLS cannot help there, because an editor is
   *authorised* to write; they simply should not be able to write
   <script>.

   So the editor is a WYSIWYG surface over this model, not over HTML.
   `htmlToBlocks` is the only door in, and it is an allowlist: it
   walks the DOM the browser produced (or that the writer pasted) and
   emits the blocks and marks below. Anything it does not recognise
   contributes its TEXT and nothing else. A pasted <script>, an
   onclick, a style attribute, an <iframe> — none of them survive the
   trip, because none of them are ever read.

   THE MODEL
   ----------------------------------------------------------------
     { type: 'p' | 'h2' | 'h3' | 'quote', text }        plain
     { type: 'p' | 'h2' | 'h3' | 'quote', spans: [...] } with marks
     { type: 'ul' | 'ol', items: [ string | {spans} ] }
     { type: 'image', src, alt, caption, mediaId }

     span := { text, bold?: true, italic?: true, href?: string }

   `text` and `spans` are alternatives, not both: a block with no
   inline marks keeps the plain `text` shape the migrated Webflow
   bodies already use (`content/collection-bodies.js`, generated), so
   re-saving an untouched article does not rewrite 40 kB of Arabic
   into a new shape for nothing.
   ================================================================ */

/** Block types that carry running text. */
const TEXT_BLOCKS = new Set(['p', 'h2', 'h3', 'quote']);
const LIST_BLOCKS = new Set(['ul', 'ol']);

/**
 * A link the browser may follow.
 *
 * `javascript:` is the obvious one; `data:` is the one people forget
 * — `data:text/html,<script>…` in an href is a same-origin XSS in
 * every browser that still opens it. Everything is resolved against
 * the document so a relative path stays relative, and only the four
 * schemes a body could legitimately need survive.
 */
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function safeHref(href) {
  const value = String(href ?? '').trim();
  if (!value) return '';
  // Anchors and site-relative paths never carry a scheme.
  if (value.startsWith('/') || value.startsWith('#')) return value;
  try {
    const url = new URL(value, 'https://bedar.org');
    return SAFE_SCHEMES.has(url.protocol) ? value : '';
  } catch {
    return '';
  }
}

/** An image `src` the browser may load. Same rules, minus mailto/tel. */
export function safeSrc(src) {
  const value = String(src ?? '').trim();
  if (!value) return '';
  if (value.startsWith('/')) return value;
  try {
    const url = new URL(value, 'https://bedar.org');
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}

/**
 * A block's inline runs, whichever shape it is stored in.
 *
 * Every renderer goes through this rather than reading `.text` or
 * `.spans` directly, so the two shapes stay interchangeable and a
 * seeded body and a dashboard-authored one render the same way.
 */
export function spansOf(block) {
  if (Array.isArray(block?.spans)) return block.spans.filter((span) => span && span.text !== '');
  const text = block?.text ?? '';
  return text === '' ? [] : [{ text }];
}

/** One list item's runs. Items are plain strings until marked up. */
export function itemSpans(item) {
  if (typeof item === 'string') return item === '' ? [] : [{ text: item }];
  if (Array.isArray(item?.spans)) return item.spans.filter((span) => span && span.text !== '');
  return [];
}

/** Flat text of one block — for word counts and reading time. */
export function blockText(block) {
  if (!block) return '';
  if (block.type === 'image') return block.caption ?? '';
  if (LIST_BLOCKS.has(block.type)) {
    return (block.items ?? []).map((item) => spansText(itemSpans(item))).join(' ');
  }
  return spansText(spansOf(block));
}

/** Flat text of a whole body. */
export function blocksText(blocks) {
  return (blocks ?? []).map(blockText).join(' ');
}

function spansText(spans) {
  return spans.map((span) => span.text ?? '').join('');
}

/** True when a body has nothing a reader would see. */
export function isEmptyBlocks(blocks) {
  return !(blocks ?? []).some((block) => block?.type === 'image' || blockText(block).trim() !== '');
}

/* ================================================================
   HTML → BLOCKS.  The allowlist.
   ================================================================ */

/** Marks we carry. Everything else contributes its text only. */
const INLINE_TAGS = {
  B: 'bold',
  STRONG: 'bold',
  I: 'italic',
  EM: 'italic',
};

const HEADING_TO_BLOCK = { H1: 'h2', H2: 'h2', H3: 'h3', H4: 'h3', H5: 'h3', H6: 'h3' };

/**
 * Collect the inline runs inside one element.
 *
 * `marks` accumulates down the tree, so `<strong><a href>text</a></strong>`
 * emits one bold link run. A `<br>` becomes a newline inside the run
 * rather than a new block — that is what shift+enter means, and
 * `RichText` renders it (see `hasBreaks` there).
 */
function collectSpans(node, marks, out) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3 /* text */) {
      const text = child.nodeValue.replace(/\s+/g, ' ');
      if (text) push(out, { ...marks, text });
      continue;
    }
    if (child.nodeType !== 1 /* element */) continue;

    const tag = child.tagName;
    if (tag === 'BR') {
      push(out, { ...marks, text: '\n' });
      continue;
    }
    // A block-level element nested inside another (a <div> inside a
    // <p>, which contentEditable does produce) reads as a line break
    // rather than as a silent join.
    if (tag === 'A') {
      const href = safeHref(child.getAttribute('href'));
      collectSpans(child, href ? { ...marks, href } : marks, out);
      continue;
    }
    const mark = INLINE_TAGS[tag];
    collectSpans(child, mark ? { ...marks, [mark]: true } : marks, out);
  }
}

/** Append a run, merging it into the previous one when identical. */
function push(out, span) {
  const previous = out[out.length - 1];
  if (
    previous &&
    Boolean(previous.bold) === Boolean(span.bold) &&
    Boolean(previous.italic) === Boolean(span.italic) &&
    (previous.href ?? '') === (span.href ?? '')
  ) {
    previous.text += span.text;
    return;
  }
  out.push(span);
}

/** Trim the run list as a whole, and drop it if nothing is left. */
function normalizeSpans(spans) {
  const runs = spans.filter((span) => span.text !== '');
  if (runs.length) {
    runs[0] = { ...runs[0], text: runs[0].text.replace(/^\s+/, '') };
    const last = runs.length - 1;
    runs[last] = { ...runs[last], text: runs[last].text.replace(/\s+$/, '') };
  }
  return runs.filter((span) => span.text !== '');
}

/**
 * A text block in storage shape: plain `text` when nothing is marked,
 * `spans` only when at least one run carries a mark.
 */
function textBlock(type, spans) {
  const runs = normalizeSpans(spans);
  if (!runs.length) return null;
  const marked = runs.some((span) => span.bold || span.italic || span.href);
  if (!marked) return { type, text: runs.map((span) => span.text).join('') };
  return { type, spans: runs };
}

function listItem(spans) {
  const runs = normalizeSpans(spans);
  if (!runs.length) return null;
  const marked = runs.some((span) => span.bold || span.italic || span.href);
  return marked ? { spans: runs } : runs.map((span) => span.text).join('');
}

function imageBlock(img, caption) {
  const src = safeSrc(img.getAttribute('src'));
  if (!src) return null;
  return {
    type: 'image',
    src,
    alt: (img.getAttribute('alt') ?? '').slice(0, 300),
    ...(caption ? { caption } : {}),
    // Set by the media picker so a re-uploaded file can be traced
    // back to its library row; absent for a pasted external image.
    ...(img.dataset?.mediaId ? { mediaId: img.dataset.mediaId } : {}),
  };
}

/**
 * Walk one element's children, emitting blocks.
 *
 * Loose inline content between block elements (a bare text node at
 * the top of a contentEditable, which is what the very first
 * keystroke into an empty editor produces) is gathered into a
 * paragraph — dropping it would lose the writer's first sentence.
 */
function walk(root, out) {
  let loose = [];

  const flush = () => {
    const block = textBlock('p', loose);
    if (block) out.push(block);
    loose = [];
  };

  for (const node of root.childNodes) {
    if (node.nodeType === 3) {
      const text = node.nodeValue.replace(/\s+/g, ' ');
      if (text.trim()) push(loose, { text });
      continue;
    }
    if (node.nodeType !== 1) continue;

    const tag = node.tagName;

    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') {
      // Not "escaped" — not read at all. Their text is markup, and
      // the whole point of the allowlist is that markup never becomes
      // content.
      continue;
    }

    if (tag === 'P' || tag === 'BLOCKQUOTE' || HEADING_TO_BLOCK[tag]) {
      flush();

      /* A text block that CONTAINS a structural one is not a text
         block. `document.execCommand('insertUnorderedList')` in
         Chromium turns `<p>x</p>` into `<p><ul><li>x</li></ul></p>`
         — the list nested inside the paragraph it replaced. Reading
         that as a paragraph flattens the list back to a line of text,
         so the toolbar button appeared to do nothing at all.

         Descend instead, and let the inner element be recognised for
         what it is. A blockquote holding only paragraphs is NOT
         structural by this test, so a pasted multi-paragraph quote
         still collapses into one quote block, which is what
         `RichText` can render. */
      if (hasStructuralChild(node)) {
        walk(node, out);
        continue;
      }

      const type = tag === 'P' ? 'p' : tag === 'BLOCKQUOTE' ? 'quote' : HEADING_TO_BLOCK[tag];
      const spans = [];
      collectSpans(node, {}, spans);
      const block = textBlock(type, spans);
      if (block) out.push(block);
      continue;
    }

    if (tag === 'UL' || tag === 'OL') {
      flush();
      const items = [];
      for (const li of node.children) {
        if (li.tagName !== 'LI') continue;
        const spans = [];
        collectSpans(li, {}, spans);
        const item = listItem(spans);
        if (item !== null) items.push(item);
      }
      if (items.length) out.push({ type: tag === 'UL' ? 'ul' : 'ol', items });
      continue;
    }

    if (tag === 'FIGURE') {
      flush();
      const img = node.querySelector('img');
      const figcaption = node.querySelector('figcaption');
      const block = img ? imageBlock(img, (figcaption?.textContent ?? '').trim()) : null;
      if (block) out.push(block);
      continue;
    }

    if (tag === 'IMG') {
      flush();
      const block = imageBlock(node, '');
      if (block) out.push(block);
      continue;
    }

    if (tag === 'BR') {
      push(loose, { text: '\n' });
      continue;
    }

    if (tag === 'HR' || tag === 'TABLE' || tag === 'PRE') {
      // Recognised, deliberately unsupported: `RichText` has no
      // element for them, so their text is kept and their shape is
      // not. Better than dropping a pasted table's contents.
      flush();
      const spans = [];
      collectSpans(node, {}, spans);
      const block = textBlock('p', spans);
      if (block) out.push(block);
      continue;
    }

    // DIV, SECTION, ARTICLE, SPAN-wrapping-blocks, and whatever else
    // a paste brought along: descend. An inline-only element reached
    // here (a bare <span> or <a> between paragraphs) is caught by the
    // loose-text path on the way through.
    if (isInlineOnly(node)) {
      collectSpans(node, {}, loose);
    } else {
      flush();
      walk(node, out);
    }
  }

  flush();
  return out;
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'FIGURE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'SECTION',
  'ARTICLE',
  'TABLE',
  'HR',
  'PRE',
]);

function isInlineOnly(node) {
  if (BLOCK_TAGS.has(node.tagName)) return false;
  return !node.querySelector?.('p,div,ul,ol,li,blockquote,figure,h1,h2,h3,h4,h5,h6,img');
}

/**
 * Does this element hold something that must keep its own shape?
 *
 * Lists, images and headings do; a nested `<p>` or `<div>` of running
 * text does not. See the call site in `walk` for why the distinction
 * exists at all.
 */
const STRUCTURAL_SELECTOR = 'ul,ol,figure,img,table,hr,pre,h1,h2,h3,h4,h5,h6';

function hasStructuralChild(node) {
  return Boolean(node.querySelector?.(STRUCTURAL_SELECTOR));
}

/**
 * Parse an HTML fragment (or a live DOM node) into blocks.
 *
 * The allowlist described in the header. Pass a string and it is
 * parsed with `DOMParser` — inert, so a `<script>` in it never runs
 * and an `<img onerror>` never fires, because the document it is
 * parsed into is never attached to anything.
 */
export function htmlToBlocks(source) {
  if (!source) return [];
  let root = source;
  if (typeof source === 'string') {
    root = new DOMParser().parseFromString(`<body>${source}</body>`, 'text/html').body;
  }
  return walk(root, []);
}

/* ================================================================
   BLOCKS → HTML.  Only ever fed to the EDITOR's contentEditable.

   Every value is escaped here, and the only attributes emitted are
   ones this module wrote. The public site does NOT use this — it
   renders the same blocks as React elements (`ui/RichText.jsx`), so
   no HTML string is involved on a visitor's page at all.
   ================================================================ */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function spansToHtml(spans) {
  return spans
    .map((span) => {
      let html = escapeHtml(span.text).replace(/\n/g, '<br>');
      if (span.bold) html = `<strong>${html}</strong>`;
      if (span.italic) html = `<em>${html}</em>`;
      const href = safeHref(span.href);
      if (href) html = `<a href="${escapeHtml(href)}">${html}</a>`;
      return html;
    })
    .join('');
}

export function blocksToHtml(blocks) {
  return (blocks ?? [])
    .map((block) => {
      if (!block?.type) return '';

      if (block.type === 'image') {
        const src = safeSrc(block.src);
        if (!src) return '';
        const mediaId = block.mediaId ? ` data-media-id="${escapeHtml(block.mediaId)}"` : '';
        const caption = block.caption
          ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
          : '<figcaption></figcaption>';
        return (
          `<figure contenteditable="false" data-block="image">` +
          `<img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt ?? '')}"${mediaId}>` +
          caption +
          `</figure>`
        );
      }

      if (LIST_BLOCKS.has(block.type)) {
        const items = (block.items ?? [])
          .map((item) => `<li>${spansToHtml(itemSpans(item))}</li>`)
          .join('');
        return items ? `<${block.type}>${items}</${block.type}>` : '';
      }

      if (TEXT_BLOCKS.has(block.type)) {
        const tag = block.type === 'quote' ? 'blockquote' : block.type;
        const inner = spansToHtml(spansOf(block));
        // An empty paragraph still needs a caret target, or the
        // browser collapses it and the writer loses the line.
        return `<${tag}>${inner || '<br>'}</${tag}>`;
      }

      return '';
    })
    .join('');
}

export { TEXT_BLOCKS, LIST_BLOCKS };
