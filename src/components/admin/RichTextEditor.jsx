import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Eye,
  Image as ImageIcon,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react';

import { Button, Input, Modal, RichText, Select } from '@components/ui';
import { mediaUrl } from '@services/mediaService.js';
import {
  blocksToFragment,
  domToBlocks,
  normalizeBlocks,
  safeHref,
  TAG_FOR_BLOCK,
} from '@utils/richtext.js';
import { cn } from '@utils/cn.js';

import { MediaPicker } from './MediaPicker.jsx';

/* ================================================================
   RICH TEXT EDITOR — ONE field for a whole article body.

   Replaces the old `BlockEditor`, which asked an author to create a
   row per paragraph and pick its type from a dropdown. The client's
   note §1 is unambiguous about that being the wrong shape: the body
   is one field, and headings, paragraphs, images, quotes and lists
   are written INSIDE it, where they read as the article.

   WHAT IT DOES NOT CHANGE
   ----------------------------------------------------------------
   The stored value. `onChange` still emits the jsonb BLOCK ARRAY
   that `collection_items.body` has always held and that
   `components/ui/RichText.jsx` renders as React elements — see the
   header of `utils/richtext.js`. The editable DOM is the interface,
   never the format: every keystroke is serialised back through
   `domToBlocks`, which keeps only what the block model can express
   and therefore drops pasted scripts, inline handlers, styles and
   `javascript:` links on the way through.

   WHY contentEditable AND NOT A LIBRARY
   ----------------------------------------------------------------
   ProseMirror/Lexical/TipTap are 40-120 kB and bring their own
   document model, which would then need translating to blocks
   anyway. What is needed here is five block types, three inline
   marks and an image — `execCommand` covers all of it in every
   browser this site supports, and the serialiser is the part that
   actually matters.

   REACT AND AN UNCONTROLLED SUBTREE
   ----------------------------------------------------------------
   React renders NO children into the editable div. It cannot: React
   would reconcile the DOM out from under the caret on every
   keystroke. The div is seeded imperatively when the incoming value
   is one this editor did not produce (a load, a reset, a reload
   after save) and left alone otherwise — `lastEmitted` is the
   identity check that tells those apart.
   ================================================================ */

const BLOCK_OPTIONS = [
  { value: 'p', label: 'فقرة' },
  { value: 'h2', label: 'عنوان رئيسي' },
  { value: 'h3', label: 'عنوان فرعي' },
  { value: 'h4', label: 'عنوان صغير' },
  { value: 'quote', label: 'اقتباس' },
];

/** How long typing may run before the parent form hears about it. */
const EMIT_DEBOUNCE_MS = 200;

/** `execCommand`, guarded — a refused command must not throw. */
function exec(command, value = null) {
  try {
    return document.execCommand(command, false, value);
  } catch {
    return false;
  }
}

function queryState(command) {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

/** The nearest block element around the caret, within `root`. */
function currentBlockType(root) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return 'p';

  let node = selection.getRangeAt(0).startContainer;
  if (node.nodeType === 3) node = node.parentNode;

  const tags = new Map(Object.entries(TAG_FOR_BLOCK).map(([type, tag]) => [tag, type]));
  while (node && node !== root) {
    const type = tags.get(node.tagName);
    if (type) return type;
    node = node.parentNode;
  }
  return 'p';
}

/** Is the caret (or selection) inside this editor? */
function selectionInside(root) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return false;
  return root.contains(selection.getRangeAt(0).commonAncestorContainer);
}

/** Put the caret at the very end of `root`. */
function caretToEnd(root) {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Our own nodes, as an HTML string, for `insertHTML`.
 *
 * Safe by construction: the fragment was built by `blocksToFragment`
 * from already-normalised blocks, so every tag and attribute in the
 * string is one this file wrote. Nothing from the clipboard reaches
 * here without having gone through `domToBlocks` first.
 */
function fragmentToHtml(fragment) {
  const holder = document.createElement('div');
  holder.appendChild(fragment);
  return holder.innerHTML;
}

/**
 * The top-level block the caret is sitting in, or `null`.
 *
 * "Top level" means a direct child of the editable root — that is the
 * granularity the block model works at, and the boundary a new
 * `<figure>` or `<hr>` has to be inserted at rather than inside.
 */
function currentTopLevelBlock(root) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;

  let node = selection.getRangeAt(0).startContainer;
  if (node === root) return root.lastElementChild;
  while (node && node.parentNode !== root) node = node.parentNode;
  return node?.nodeType === 1 ? node : null;
}

export function RichTextEditor({ value, onChange, label = 'المحتوى', hint }) {
  const rootRef = useRef(null);
  const emitTimer = useRef(null);
  /** The exact array this editor last handed the parent. */
  const lastEmitted = useRef(null);
  /** The `value` identity the DOM was last seeded from. */
  const seededFrom = useRef(undefined);
  /** The selection to restore after a modal steals focus. */
  const savedRange = useRef(null);

  const [preview, setPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [marks, setMarks] = useState({ bold: false, italic: false, link: false, block: 'p' });

  const blocks = useMemo(() => normalizeBlocks(value), [value]);

  /* ── Seeding ──────────────────────────────────────────────────
        Runs on mount, and again only when the parent hands over a
        value this editor did not produce. Typing therefore never
        rebuilds the DOM and never moves the caret. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (seededFrom.current === value) return;

    seededFrom.current = value;
    if (value === lastEmitted.current) return; // our own echo

    root.replaceChildren(blocksToFragment(document, value));
  }, [value]);

  /* Paragraphs, not `<div>`s, for Enter. Set once — it is a document
     level flag, and Firefox ignores it entirely (it already uses
     `<p>`), which is why `domToBlocks` maps DIV to a paragraph too. */
  useEffect(() => {
    exec('defaultParagraphSeparator', 'p');
    exec('styleWithCSS', 'false');
  }, []);

  const emitNow = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    if (emitTimer.current) {
      clearTimeout(emitTimer.current);
      emitTimer.current = null;
    }
    const next = domToBlocks(root);
    lastEmitted.current = next;
    seededFrom.current = next;
    onChange(next);
  }, [onChange]);

  const emitSoon = useCallback(() => {
    if (emitTimer.current) clearTimeout(emitTimer.current);
    emitTimer.current = setTimeout(emitNow, EMIT_DEBOUNCE_MS);
  }, [emitNow]);

  useEffect(() => () => clearTimeout(emitTimer.current), []);

  /**
   * Toolbar state follows the caret.
   *
   * `selectionchange` fires on every arrow key, so the new state is
   * compared before it is set — otherwise the whole editor re-renders
   * once per keypress for a toolbar that did not change.
   */
  const syncMarks = useCallback(() => {
    const root = rootRef.current;
    if (!root || !selectionInside(root)) return;

    const next = {
      bold: queryState('bold'),
      italic: queryState('italic'),
      link: Boolean(document.getSelection()?.anchorNode?.parentElement?.closest('a')),
      block: currentBlockType(root),
    };

    setMarks((current) =>
      current.bold === next.bold &&
      current.italic === next.italic &&
      current.link === next.link &&
      current.block === next.block
        ? current
        : next,
    );
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', syncMarks);
    return () => document.removeEventListener('selectionchange', syncMarks);
  }, [syncMarks]);

  /** Focus the editor, restore a caret if we lost one, run, re-emit. */
  const run = useCallback(
    (command, argument) => {
      const root = rootRef.current;
      if (!root) return;

      root.focus();
      if (!selectionInside(root)) caretToEnd(root);
      exec(command, argument);
      emitNow();
      syncMarks();
    },
    [emitNow, syncMarks],
  );

  /**
   * Insert our own nodes as SIBLING BLOCKS after the caret's block.
   *
   * NOT via `insertHTML`: that nests what it is given inside the
   * block the caret is in, so an `<hr>` or a `<figure>` ends up
   * INSIDE a paragraph — somewhere the block model cannot represent
   * it, which reads to the author as the divider they just inserted
   * vanishing on save. (`domToBlocks` recovers a nested one now too,
   * for pastes; this is the half that puts it in the right place to
   * begin with.)
   *
   * A fresh empty paragraph follows the insertion so there is
   * somewhere to keep typing after an image — otherwise the caret is
   * stranded and the author has to click.
   */
  const insertBlocks = useCallback(
    (toInsert) => {
      const root = rootRef.current;
      if (!root) return;

      root.focus();
      if (!selectionInside(root)) caretToEnd(root);

      const fragment = blocksToFragment(document, toInsert);
      const inserted = [...fragment.childNodes];
      const anchor = currentTopLevelBlock(root);

      if (anchor) anchor.after(fragment);
      else root.appendChild(fragment);

      // Land the caret in the block after what was inserted, adding
      // one if the insertion is now the last thing in the document.
      const last = inserted.at(-1);
      let next = last?.nextElementSibling;
      if (!next) {
        next = document.createElement('p');
        next.appendChild(document.createElement('br'));
        last?.after(next);
      }
      const range = document.createRange();
      range.setStart(next, 0);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      emitNow();
    },
    [emitNow],
  );

  /**
   * Paste, which is inline-or-block depending on what was copied, so
   * it keeps `insertHTML` — a pasted sentence must land in the middle
   * of the sentence being written, not after it. Block-level content
   * that `insertHTML` nests is recovered by `domToBlocks`.
   */
  const insertPasted = useCallback(
    (toInsert) => {
      const root = rootRef.current;
      if (!root) return;

      root.focus();
      if (!selectionInside(root)) caretToEnd(root);
      exec('insertHTML', fragmentToHtml(blocksToFragment(document, toInsert)));
      emitNow();
    },
    [emitNow],
  );

  const rememberSelection = () => {
    const selection = window.getSelection();
    savedRange.current =
      selection && selection.rangeCount && selectionInside(rootRef.current)
        ? selection.getRangeAt(0).cloneRange()
        : null;
  };

  const restoreSelection = () => {
    const root = rootRef.current;
    if (!root) return;
    root.focus();
    if (savedRange.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    } else {
      caretToEnd(root);
    }
  };

  /* ── Paste ────────────────────────────────────────────────────
        The clipboard is the main way hostile markup would arrive:
        copying from a CMS or a Word document brings `<script>`,
        `<style>`, `style=` and absolute font stacks with it. It is
        parsed with DOMParser (which does not execute anything),
        reduced to blocks, and rebuilt from OUR nodes — so what lands
        in the document is exactly what the model can store, and the
        paste already looks like the article it will become. */
  const handlePaste = (event) => {
    const html = event.clipboardData?.getData('text/html');
    const text = event.clipboardData?.getData('text/plain');
    if (!html && !text) return;

    event.preventDefault();

    if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const pasted = domToBlocks(parsed.body);
      if (pasted.length) {
        insertPasted(pasted);
        return;
      }
    }
    exec('insertText', text ?? '');
    emitNow();
  };

  const applyLink = () => {
    const href = safeHref(linkDraft);
    setLinkOpen(false);
    if (!href) return;
    restoreSelection();
    exec('createLink', href);
    // `createLink` cannot set attributes; external targets are added
    // by the renderer, which knows whether the link leaves the site.
    emitNow();
    syncMarks();
  };

  const insertImage = (media) => {
    const src = mediaUrl(media);
    if (!src) return;
    restoreSelection();
    insertBlocks([{ type: 'image', src, alt: media.alt_text ?? '', caption: '' }]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        <Button variant="ghost" size="sm" onClick={() => setPreview((current) => !current)}>
          <Eye className="size-4" aria-hidden="true" />
          {preview ? 'تحرير' : 'معاينة'}
        </Button>
      </div>

      {preview ? (
        <div className="rounded-lg border border-subtle bg-surface p-6">
          {blocks.length ? (
            <RichText blocks={blocks} />
          ) : (
            <p className="text-sm text-ink-muted">لا يوجد محتوى بعد.</p>
          )}
        </div>
      ) : (
        <div className="rte">
          {/* `onMouseDown` + preventDefault on every control: a
              toolbar button must not take focus, or the selection it
              is meant to act on is gone before the click lands. */}
          <div className="rte-toolbar" role="toolbar" aria-label="أدوات تنسيق النص">
            <Select
              label="نوع الفقرة"
              labelHidden
              options={BLOCK_OPTIONS}
              value={marks.block}
              onMouseDown={rememberSelection}
              onChange={(event) => run('formatBlock', `<${TAG_FOR_BLOCK[event.target.value]}>`)}
              fieldClassName="w-36"
            />

            <span className="rte-sep" aria-hidden="true" />

            <ToolButton label="عريض" icon={Bold} active={marks.bold} onClick={() => run('bold')} />
            <ToolButton
              label="مائل"
              icon={Italic}
              active={marks.italic}
              onClick={() => run('italic')}
            />
            <ToolButton
              label="إضافة رابط"
              icon={Link2}
              active={marks.link}
              onClick={() => {
                rememberSelection();
                setLinkDraft('');
                setLinkOpen(true);
              }}
            />
            <ToolButton label="إزالة الرابط" icon={Link2Off} onClick={() => run('unlink')} />

            <span className="rte-sep" aria-hidden="true" />

            <ToolButton
              label="قائمة نقطية"
              icon={List}
              onClick={() => run('insertUnorderedList')}
            />
            <ToolButton
              label="قائمة مرقّمة"
              icon={ListOrdered}
              onClick={() => run('insertOrderedList')}
            />
            <ToolButton
              label="اقتباس"
              icon={Quote}
              active={marks.block === 'quote'}
              onClick={() => run('formatBlock', '<BLOCKQUOTE>')}
            />

            <span className="rte-sep" aria-hidden="true" />

            <ToolButton
              label="إدراج صورة"
              icon={ImageIcon}
              onClick={() => {
                rememberSelection();
                setPickerOpen(true);
              }}
            />
            <ToolButton
              label="فاصل"
              icon={Minus}
              onClick={() => insertBlocks([{ type: 'divider' }])}
            />

            <span className="rte-sep" aria-hidden="true" />

            <ToolButton label="تراجع" icon={Undo2} onClick={() => run('undo')} />
            <ToolButton label="إعادة" icon={Redo2} onClick={() => run('redo')} />
          </div>

          <div
            ref={rootRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={label}
            spellCheck="true"
            dir="rtl"
            className="rte-surface"
            onInput={emitSoon}
            onBlur={emitNow}
            onPaste={handlePaste}
            // A dropped file becomes a `data:` image the model
            // refuses, so it would silently vanish on save. The image
            // button puts it in the media library instead, where it
            // is reusable and has alt text.
            onDrop={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                rememberSelection();
                setLinkDraft('');
                setLinkOpen(true);
              }
            }}
          />
        </div>
      )}

      {hint ? <p className="text-xs leading-relaxed text-ink-muted">{hint}</p> : null}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={insertImage}
        title="إدراج صورة في النص"
      />

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="إضافة رابط">
        <div className="flex flex-col gap-4">
          <Input
            label="الرابط"
            dir="ltr"
            autoFocus
            placeholder="https://example.com"
            value={linkDraft}
            onChange={(event) => setLinkDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              }
            }}
            hint="روابط https، أو بريد mailto:، أو مسار داخلي يبدأ بـ /."
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setLinkOpen(false)}>
              إلغاء
            </Button>
            <Button size="sm" onClick={applyLink} disabled={!safeHref(linkDraft)}>
              إضافة الرابط
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ToolButton({ label, icon: Icon, onClick, active = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn('rte-tool', active && 'rte-tool-active')}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

export default RichTextEditor;
