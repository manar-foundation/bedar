/* ================================================================
   RICH TEXT — the block model, and the two translations either side
   of it: blocks → DOM (what the editor shows) and DOM → blocks
   (what the editor saves).

   WHY NOT AN HTML STRING
   ----------------------------------------------------------------
   The client asked for ONE Rich Text field per article instead of a
   list of typed paragraph rows — headings, paragraphs, images,
   quotes and lists authored together, in place. That is a demand on
   the EDITING EXPERIENCE, and it is met in full by
   `components/admin/RichTextEditor.jsx`.

   It is not a demand on the storage format, and the storage format
   does not change: a body is still a jsonb ARRAY OF BLOCKS, and
   `components/ui/RichText.jsx` still renders those blocks as real
   React elements. Storing the editor's HTML instead would mean
   rendering dashboard-authored markup through
   `dangerouslySetInnerHTML`, which makes every editor account an XSS
   vector — RLS does not help there, because an editor is
   *authorised* to write; they simply should not be able to write
   `<script>`. CLAUDE.md states this rule; §1 of the client's notes
   does not ask us to break it.

   `domToBlocks` is therefore both the serialiser AND the sanitiser:
   it walks the editable DOM and keeps only what the block model can
   express. A pasted `<script>`, a `javascript:` link, an inline
   `onerror`, a `<style>` block, a tracking pixel from another
   origin — none of them survive the walk, because there is no block
   that can hold them.

   THE MODEL
   ----------------------------------------------------------------
     inline run   { text, bold?, italic?, href? }

     block        { type: 'p'   | 'h2' | 'h3' | 'h4' | 'quote',
                    content: run[] }
                  { type: 'ul'  | 'ol', items: run[][] }
                  { type: 'image', src, alt, caption }
                  { type: 'divider' }

   LEGACY. Bodies written before this file used `{ type, text }` and
   `{ type: 'ul', items: string[] }`. Both are still read — see
   `normalizeBlocks`, which is the single place that knows about the
   old shape, and the reason no migration of stored content is
   required.
   ================================================================ */

/* ── Blocks the model can express ─────────────────────────────── */

/** Blocks whose payload is one run of inline content. */
export const TEXT_BLOCKS = ['p', 'h2', 'h3', 'h4', 'quote'];

/** Blocks whose payload is a list of runs. */
export const LIST_BLOCKS = ['ul', 'ol'];

const TEXT_BLOCK_SET = new Set(TEXT_BLOCKS);
const LIST_BLOCK_SET = new Set(LIST_BLOCKS);

/** The editable tag each text block round-trips through. */
export const TAG_FOR_BLOCK = {
  p: 'P',
  h2: 'H2',
  h3: 'H3',
  h4: 'H4',
  quote: 'BLOCKQUOTE',
};

const BLOCK_FOR_TAG = {
  P: 'p',
  DIV: 'p',
  H1: 'h2', // The page already owns the single H1; demote a pasted one.
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  H5: 'h4',
  H6: 'h4',
  BLOCKQUOTE: 'quote',
};

/* ── URL safety ───────────────────────────────────────────────────
   The two places a string from the editor becomes a URL. Both are
   allow-lists, because a deny-list of "javascript:" is defeated by
   "java\tscript:" and by a dozen other encodings the parser folds
   away but a regex does not. */

/**
 * A link target we are willing to store, or `''`.
 *
 * Absolute http(s), mail, phone, or a same-site path/anchor. Note
 * that `href` values arrive already resolved by the browser when
 * they come from `createLink`, so a relative path shows up absolute
 * — that is fine, both forms are accepted.
 */
export function safeHref(value) {
  const href = String(value ?? '').trim();
  if (!href) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  // Same-site: a path or a fragment. `//host` is protocol-relative
  // and is NOT a path, so it is rejected by the second character.
  if (/^\/(?!\/)/.test(href) || href.startsWith('#')) return href;
  return '';
}

/**
 * An image source we are willing to store, or `''`.
 *
 * http(s) or a same-site path. `data:` is refused: an inline image
 * in a body is a megabyte of base64 in a jsonb column, and
 * `data:image/svg+xml` is a script vector.
 */
export function safeSrc(value) {
  const src = String(value ?? '').trim();
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  if (/^\/(?!\/)/.test(src)) return src;
  return '';
}

/* ── Normalisation ────────────────────────────────────────────── */

/** `'  a  b '` → `' a b '` — collapse runs of whitespace, keep edges. */
function collapse(text) {
  return String(text ?? '').replace(/[\t\n\r ]+/g, ' ');
}

/** One inline run, or `null` when it carries nothing to render. */
function normalizeRun(run) {
  if (typeof run === 'string') return run ? { text: run } : null;
  if (!run || typeof run !== 'object') return null;

  const text = String(run.text ?? '');
  if (!text) return null;

  const out = { text };
  if (run.bold) out.bold = true;
  if (run.italic) out.italic = true;

  const href = safeHref(run.href);
  if (href) out.href = href;
  return out;
}

/**
 * A run array, with adjacent runs that carry identical marks merged.
 *
 * The merge is not cosmetic: `execCommand` happily leaves
 * `<b>ال</b><b>ريادة</b>` behind after an edit, and without it every
 * save would grow the array and every diff would look like a change.
 */
function normalizeRuns(value) {
  const source = Array.isArray(value) ? value : value == null ? [] : [value];
  const runs = [];

  for (const item of source) {
    const run = normalizeRun(item);
    if (!run) continue;

    const previous = runs.at(-1);
    if (
      previous &&
      Boolean(previous.bold) === Boolean(run.bold) &&
      Boolean(previous.italic) === Boolean(run.italic) &&
      (previous.href ?? '') === (run.href ?? '')
    ) {
      previous.text += run.text;
      continue;
    }
    runs.push(run);
  }

  return runs;
}

/** Plain text → a single-run array. The legacy `{ text }` shape. */
function runsFromText(text) {
  const value = String(text ?? '');
  return value ? [{ text: value }] : [];
}

/**
 * One stored block in canonical form, or `null` when it is empty or
 * of a type the model does not have.
 *
 * This is the ONLY function that knows the legacy `{ type, text }`
 * and `items: string[]` shapes, which is what lets every body
 * written before the rich-text editor keep rendering untouched.
 */
function normalizeBlock(block) {
  if (!block || typeof block !== 'object') return null;
  const type = String(block.type ?? 'p');

  if (type === 'divider') return { type: 'divider' };

  if (type === 'image') {
    const src = safeSrc(block.src);
    if (!src) return null;
    const out = { type: 'image', src, alt: String(block.alt ?? '') };
    const caption = collapse(block.caption).trim();
    if (caption) out.caption = caption;
    return out;
  }

  if (LIST_BLOCK_SET.has(type)) {
    const items = (Array.isArray(block.items) ? block.items : [])
      .map((item) => (typeof item === 'string' ? runsFromText(item) : normalizeRuns(item)))
      .filter((runs) => runs.length > 0);
    return items.length ? { type, items } : null;
  }

  const kind = TEXT_BLOCK_SET.has(type) ? type : 'p';
  const content =
    block.content !== undefined ? normalizeRuns(block.content) : runsFromText(block.text);
  return content.length ? { type: kind, content } : null;
}

/** A whole body in canonical form. Empty blocks are dropped. */
export function normalizeBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map(normalizeBlock).filter(Boolean);
}

/** The body as one string — for the reading-time estimate and search. */
export function blocksToPlainText(blocks) {
  const parts = [];
  for (const block of normalizeBlocks(blocks)) {
    if (block.type === 'image') {
      if (block.caption) parts.push(block.caption);
    } else if (LIST_BLOCK_SET.has(block.type)) {
      for (const item of block.items) parts.push(item.map((run) => run.text).join(''));
    } else if (block.content) {
      parts.push(block.content.map((run) => run.text).join(''));
    }
  }
  return parts.join(' ');
}

/** True when a body has nothing a reader would see. */
export function isEmptyBody(blocks) {
  return normalizeBlocks(blocks).length === 0;
}

/* ================================================================
   BLOCKS → DOM

   Built with `createElement` + `textContent` throughout. Nothing
   here ever assigns `innerHTML`, so a body that somehow contains a
   hostile string cannot become markup on the way INTO the editor
   either — the round trip is safe in both directions.
   ================================================================ */

/** One inline run as a DOM node, wrapped in whatever marks it carries. */
function runToNode(doc, run) {
  let node = doc.createTextNode(run.text);

  if (run.bold) {
    const strong = doc.createElement('strong');
    strong.appendChild(node);
    node = strong;
  }
  if (run.italic) {
    const em = doc.createElement('em');
    em.appendChild(node);
    node = em;
  }
  if (run.href) {
    const anchor = doc.createElement('a');
    anchor.setAttribute('href', run.href);
    anchor.appendChild(node);
    node = anchor;
  }
  return node;
}

function appendRuns(doc, parent, runs) {
  for (const run of runs) parent.appendChild(runToNode(doc, run));
  // An empty block still needs a line box, or the caret cannot be
  // placed in it and the editor swallows the paragraph.
  if (!runs.length) parent.appendChild(doc.createElement('br'));
}

/** One block as a DOM element. */
function blockToNode(doc, block) {
  if (block.type === 'divider') return doc.createElement('hr');

  if (block.type === 'image') {
    const figure = doc.createElement('figure');
    figure.setAttribute('data-block', 'image');

    const img = doc.createElement('img');
    img.setAttribute('src', block.src);
    img.setAttribute('alt', block.alt ?? '');
    figure.appendChild(img);

    const caption = doc.createElement('figcaption');
    if (block.caption) caption.textContent = block.caption;
    // The caption is the one editable part of a figure; the
    // placeholder is CSS (`admin.css`), keyed off the empty state.
    caption.setAttribute('data-placeholder', 'وصف الصورة (اختياري)');
    figure.appendChild(caption);
    return figure;
  }

  if (LIST_BLOCK_SET.has(block.type)) {
    const list = doc.createElement(block.type === 'ol' ? 'ol' : 'ul');
    for (const item of block.items) {
      const li = doc.createElement('li');
      appendRuns(doc, li, item);
      list.appendChild(li);
    }
    return list;
  }

  const element = doc.createElement(TAG_FOR_BLOCK[block.type] ?? 'P');
  appendRuns(doc, element, block.content ?? []);
  return element;
}

/**
 * A whole body as a `DocumentFragment`, ready to be dropped into the
 * editable root. A body with no blocks yields one empty paragraph,
 * so the editor always has somewhere to put the caret.
 */
export function blocksToFragment(doc, blocks) {
  const fragment = doc.createDocumentFragment();
  const normalized = normalizeBlocks(blocks);

  if (!normalized.length) {
    fragment.appendChild(blockToNode(doc, { type: 'p', content: [] }));
    return fragment;
  }

  for (const block of normalized) fragment.appendChild(blockToNode(doc, block));
  return fragment;
}

/* ================================================================
   DOM → BLOCKS   (the serialiser, and therefore the sanitiser)
   ================================================================ */

const INLINE_SKIP = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'IFRAME',
  'OBJECT',
  'EMBED',
]);

/**
 * Tags that can only be a BLOCK, never part of a run.
 *
 * Used to detect mixed content. `execCommand('insertHTML')` and most
 * clipboards happily nest an `<hr>` or a `<figure>` INSIDE the
 * paragraph the caret was in, and a serialiser that only inspects
 * top-level children swallows it — which reads to the author as the
 * divider they just inserted disappearing when they save.
 */
const BLOCK_LEVEL = new Set([
  'P',
  'DIV',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'UL',
  'OL',
  'FIGURE',
  'PICTURE',
  'IMG',
  'HR',
]);

/** The CSS form of `BLOCK_LEVEL`, for a one-shot containment test. */
const BLOCK_LEVEL_SELECTOR = [...BLOCK_LEVEL].join(',').toLowerCase();

/** True for an element the block model must give a block of its own. */
export function isBlockLevel(node) {
  return node?.nodeType === 1 && BLOCK_LEVEL.has(node.tagName);
}

/**
 * Collect the inline runs inside `node`, carrying marks down.
 *
 * Anything that is not a text node, a mark or a link is simply
 * DESCENDED INTO — a `<span style=…>` contributes its text and
 * nothing else, and a `<script>` contributes nothing at all. That is
 * the sanitiser: unknown markup cannot survive because there is no
 * block or mark that can hold it.
 */
function collectRuns(node, marks, out) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3 /* text */) {
      if (child.nodeValue) out.push({ ...marks, text: collapse(child.nodeValue) });
      continue;
    }
    if (child.nodeType !== 1 /* element */) continue;

    const tag = child.tagName;
    if (INLINE_SKIP.has(tag)) continue;

    if (tag === 'BR') {
      // A soft break inside a paragraph. The model has no <br>, and
      // a space is the honest rendering of one.
      out.push({ ...marks, text: ' ' });
      continue;
    }

    const next = { ...marks };
    if (tag === 'STRONG' || tag === 'B') next.bold = true;
    if (tag === 'EM' || tag === 'I') next.italic = true;
    if (tag === 'A') {
      const href = safeHref(child.getAttribute('href'));
      // A link we refuse keeps its TEXT and loses its destination —
      // silently dropping the words would look like data loss.
      if (href) next.href = href;
      else delete next.href;
    }

    collectRuns(child, next, out);
  }
}

function runsOf(node) {
  const out = [];
  collectRuns(node, {}, out);
  return normalizeRuns(out);
}

/**
 * Every block inside an editable root, in document order.
 *
 * Loose inline content — the text a browser leaves directly under
 * the root after certain paste and delete operations — is gathered
 * into paragraphs rather than dropped.
 */
export function domToBlocks(root) {
  const blocks = [];
  let loose = [];

  const flushLoose = () => {
    const runs = normalizeRuns(loose);
    loose = [];
    if (runs.length) blocks.push({ type: 'p', content: runs });
  };

  const visit = (node) => {
    if (node.nodeType === 3) {
      if (node.nodeValue?.trim()) loose.push({ text: collapse(node.nodeValue) });
      return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.tagName;
    if (INLINE_SKIP.has(tag)) return;

    if (tag === 'HR') {
      flushLoose();
      blocks.push({ type: 'divider' });
      return;
    }

    if (tag === 'FIGURE' || tag === 'IMG' || tag === 'PICTURE') {
      flushLoose();
      const img = tag === 'IMG' ? node : node.querySelector('img');
      const src = safeSrc(img?.getAttribute('src'));
      if (src) {
        const caption = node.querySelector?.('figcaption');
        blocks.push({
          type: 'image',
          src,
          alt: img.getAttribute('alt') ?? '',
          caption: collapse(caption?.textContent ?? '').trim(),
        });
      }
      return;
    }

    if (tag === 'UL' || tag === 'OL') {
      flushLoose();
      const items = [];
      for (const li of node.children) {
        if (li.tagName !== 'LI') continue;

        // A list nested inside an item is flattened UP into the
        // parent list: the model has one level, and losing the words
        // to keep the shape would be the wrong trade. The nested
        // list is lifted off a clone first, so its text is not also
        // counted as part of its parent item.
        const clone = li.cloneNode(true);
        const nested = [...clone.querySelectorAll(':scope > ul, :scope > ol')];
        for (const list of nested) list.remove();

        const runs = runsOf(clone);
        if (runs.length) items.push(runs);

        for (const list of nested) {
          for (const child of list.children) {
            const childRuns = runsOf(child);
            if (childRuns.length) items.push(childRuns);
          }
        }
      }
      if (items.length) blocks.push({ type: node.tagName === 'OL' ? 'ol' : 'ul', items });
      return;
    }

    const type = BLOCK_FOR_TAG[tag];
    if (type) {
      flushLoose();

      /* MIXED CONTENT. A block element that also contains block
         children is not one paragraph — it is a container (the
         wrapper `<div>` Chrome produces), or a paragraph with
         something dropped inside it (the `<hr>` `insertHTML` nests
         under the caret's block, or a `<figure>` from a paste).

         Flattening it would fold a heading into the line above;
         reading only its top-level children would lose the `<hr>`
         entirely. So the inline stretches are emitted as blocks of
         THIS type, in order, with each block-level child visited
         where it actually sits. */
      if (node.querySelector(BLOCK_LEVEL_SELECTOR)) {
        let runs = [];
        const flushRuns = () => {
          const normalized = normalizeRuns(runs);
          runs = [];
          if (normalized.length) blocks.push({ type, content: normalized });
        };

        for (const child of [...node.childNodes]) {
          if (isBlockLevel(child)) {
            flushRuns();
            visit(child);
          } else {
            collectRuns({ childNodes: [child] }, {}, runs);
          }
        }
        flushRuns();
        return;
      }

      const runs = runsOf(node);
      if (runs.length) blocks.push({ type, content: runs });
      return;
    }

    // An inline element with no block of its own (`<span>`, a bare
    // `<a>`, a `<strong>` left behind by a delete). Wrapped so
    // `collectRuns` sees it as a CHILD and therefore applies its own
    // mark — passing it directly would drop the mark it carries.
    collectRuns({ childNodes: [node] }, {}, loose);
  };

  for (const child of [...root.childNodes]) visit(child);
  flushLoose();

  return normalizeBlocks(blocks);
}

export default {
  normalizeBlocks,
  blocksToPlainText,
  blocksToFragment,
  domToBlocks,
  isEmptyBody,
  safeHref,
  safeSrc,
};
