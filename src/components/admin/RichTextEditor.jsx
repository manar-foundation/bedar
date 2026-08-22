import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Undo2,
  Unlink,
} from 'lucide-react';

import { Button, RichText } from '@components/ui';
import { cn } from '@utils/cn.js';
import { blocksToHtml, blocksText, htmlToBlocks, isEmptyBlocks } from '@utils/richtext.js';

import { MediaPicker } from './MediaPicker.jsx';
import { mediaUrl } from '@services/mediaService.js';

/* ================================================================
   RICH TEXT EDITOR — one field for a whole article (client note ١).

   WHAT THIS REPLACED
   ----------------------------------------------------------------
   `BlockEditor`: a numbered list of cards, one per paragraph, each
   with its own type dropdown and its own textarea. It was correct
   and it was miserable — writing a twelve-paragraph article meant
   twelve "add paragraph" clicks, and the text was never visible as a
   piece of writing. The client's words: "كل فقرة بدي انشئلها قسم خاص
   فيها واحدد نوع القسم … لازم نستبدل هي الطريقة بطريقة ثانية وهي
   عبارة عن حقل واحد لنص المقال يكون من نوع Rich Text".

   So: one editing surface, a toolbar, and the writer types.

   WHAT IT DID NOT GIVE UP
   ----------------------------------------------------------------
   The document is edited as HTML (that is what contentEditable is)
   and STORED as blocks. Every keystroke round-trips through
   `htmlToBlocks`, which is an allowlist — see the header of
   `utils/richtext.js`. Nothing that is not a paragraph, heading,
   quote, list, image or one of three inline marks can survive being
   typed, pasted, or injected into this box, so the "no HTML string
   in the database" rule that CLAUDE.md calls non-negotiable still
   holds exactly as it did.

   THE CARET RULE
   ----------------------------------------------------------------
   A contentEditable must NOT be re-rendered from React state as the
   writer types: rewriting `innerHTML` moves the caret to the start on
   every keystroke. So the DOM is seeded ONCE per loaded document
   (`documentKey`), never from `value` on re-render, and `onChange`
   flows one way — out. `pendingRef` holds the blocks we just emitted
   so a parent echoing them straight back is recognised and ignored.

   `document.execCommand` is formally deprecated and has no
   replacement; every browser still implements it, and the whole
   editing surface here is a few hundred lines because of it. The
   alternative is a ~40 kB editor framework for a field used on three
   screens. If it is ever removed, this component is the only place
   that has to change — the model it writes is independent of it.
   ================================================================ */

const BLOCK_FORMATS = [
  { command: 'p', tag: 'P', label: 'فقرة', icon: Pilcrow },
  { command: 'h2', tag: 'H2', label: 'عنوان رئيسي', icon: Heading2 },
  { command: 'h3', tag: 'H3', label: 'عنوان فرعي', icon: Heading3 },
  { command: 'blockquote', tag: 'BLOCKQUOTE', label: 'اقتباس', icon: Quote },
];

export function RichTextEditor({
  value = [],
  onChange,
  label = 'المحتوى',
  hint,
  documentKey = 'default',
  disabled = false,
}) {
  const editorRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [active, setActive] = useState({ block: 'P', bold: false, italic: false, link: false });

  /* The blocks this component last emitted. A parent that stores them
     and passes them straight back is not a new document — comparing
     against this is what stops the seed effect from firing on every
     save and stealing the caret. */
  const pendingRef = useRef(null);

  /* Seed the surface — on a new document, and on a `value` that did
     NOT come from this component.

     The second half is the caret rule in the header. A keystroke
     emits blocks, the parent stores them, and they arrive back here
     as a new `value` one render later; rewriting `innerHTML` at that
     point would drop the caret to the top of the article on every
     letter typed. `pendingRef` is what we last emitted, so an echo is
     recognised and ignored — while a value we did NOT produce (the
     save bar's "تراجع", a reload after saving, a different row) is a
     real change of document and does re-seed. */
  const seededKey = useRef(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const isNewDocument = seededKey.current !== documentKey;
    if (isNewDocument) {
      seededKey.current = documentKey;
      pendingRef.current = null;
    } else if (pendingRef.current && sameBlocks(pendingRef.current, value)) {
      return;
    }

    pendingRef.current = value;
    // An empty document still needs one paragraph to put the caret
    // in, or the first keystroke lands in a bare text node.
    const html = blocksToHtml(value) || '<p><br></p>';
    if (editor.innerHTML !== html) editor.innerHTML = html;
  }, [value, documentKey]);

  const emit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !onChange) return;
    const blocks = htmlToBlocks(editor);
    pendingRef.current = blocks;
    onChange(blocks);
  }, [onChange]);

  /** Which formats apply where the caret is, for the toolbar state. */
  const syncActive = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = window.getSelection();
    let node = selection?.anchorNode ?? null;
    if (node && !editor.contains(node)) return;

    let block = 'P';
    let link = false;
    while (node && node !== editor) {
      if (node.nodeType === 1) {
        if (node.tagName === 'A') link = true;
        if (['P', 'H2', 'H3', 'BLOCKQUOTE', 'LI', 'UL', 'OL'].includes(node.tagName)) {
          if (block === 'P') block = node.tagName;
        }
      }
      node = node.parentNode;
    }

    setActive({
      block,
      bold: safeQuery('bold'),
      italic: safeQuery('italic'),
      link,
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', syncActive);
    return () => document.removeEventListener('selectionchange', syncActive);
  }, [syncActive]);

  const run = (command, argument) => {
    if (disabled) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, argument);
    syncActive();
    emit();
  };

  const setBlock = (format) => {
    // `formatBlock` needs the angle-bracket form in some engines and
    // tolerates it in all of them.
    run('formatBlock', `<${format}>`);
  };

  /**
   * Paste as CONTENT, never as markup.
   *
   * The clipboard's `text/html` is run through the same allowlist the
   * editor stores through, then re-rendered from our own model — so
   * pasting a Word document or a Webflow page brings its headings,
   * lists and links and nothing else: no styles, no classes, no
   * scripts, no tracking pixels.
   */
  const handlePaste = (event) => {
    if (disabled) return;
    event.preventDefault();
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');

    if (html) {
      const clean = blocksToHtml(htmlToBlocks(html));
      if (clean) {
        document.execCommand('insertHTML', false, clean);
        emit();
        return;
      }
    }
    // Plain text: keep the writer's line breaks as paragraphs.
    const paragraphs = text
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);
    if (paragraphs.length > 1) {
      document.execCommand(
        'insertHTML',
        false,
        blocksToHtml(htmlToBlocks(toParagraphs(paragraphs))),
      );
    } else {
      document.execCommand('insertText', false, text);
    }
    emit();
  };

  const insertLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      window.alert('حدّد النص الذي تريد ربطه أولاً.');
      return;
    }
    const href = window.prompt('الرابط:', 'https://');
    if (!href) return;
    run('createLink', href);
  };

  const insertImage = (media) => {
    if (!media) return;
    const url = mediaUrl(media);
    if (!url) return;
    const html = blocksToHtml([
      {
        type: 'image',
        src: url,
        alt: media.alt_text ?? '',
        mediaId: media.id,
      },
      // A trailing paragraph, or an image at the end of the document
      // leaves nowhere to put the caret and the writer is stuck.
      { type: 'p', text: '' },
    ]);
    const editor = editorRef.current;
    editor?.focus();
    document.execCommand('insertHTML', false, html);
    emit();
  };

  const words = blocksText(value).trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        <div className="flex items-center gap-2">
          <span className="ltr-run text-xs text-ink-muted">{words} كلمة</span>
          <Button variant="ghost" size="sm" onClick={() => setPreview((current) => !current)}>
            <Eye className="size-4" aria-hidden="true" />
            {preview ? 'تحرير' : 'معاينة'}
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="rounded-lg border border-subtle bg-surface p-6">
          {isEmptyBlocks(value) ? (
            <p className="text-sm text-ink-muted">لا يوجد محتوى بعد.</p>
          ) : (
            <RichText blocks={value} />
          )}
        </div>
      ) : null}

      {/* HIDDEN, NEVER UNMOUNTED, while previewing.

          Unmounting it loses the surface: the seeding effect above
          only re-seeds a NEW document or an EXTERNAL value, so the
          freshly mounted (empty) box on the way back from preview
          matched neither and stayed blank — the article looked
          deleted. Keeping the node alive also preserves the
          browser's own undo stack across a preview toggle, which a
          remount would throw away. */}
      <div
        hidden={preview}
        className={cn(
          'overflow-hidden rounded-lg border border-subtle bg-surface',
          'focus-within:border-brand-400 focus-within:shadow-focus',
          disabled && 'pointer-events-none opacity-60',
          preview && 'hidden',
        )}
      >
        <div
          role="toolbar"
          aria-label="أدوات التنسيق"
          className="flex flex-wrap items-center gap-0.5 border-b border-subtle bg-sunken px-2 py-1.5"
        >
          {BLOCK_FORMATS.map((format) => (
            <ToolButton
              key={format.command}
              label={format.label}
              icon={format.icon}
              pressed={active.block === format.tag}
              onClick={() => setBlock(format.command)}
            />
          ))}

          <Divider />

          <ToolButton
            label="قائمة نقطية"
            icon={List}
            pressed={active.block === 'UL'}
            onClick={() => run('insertUnorderedList')}
          />
          <ToolButton
            label="قائمة مرقّمة"
            icon={ListOrdered}
            pressed={active.block === 'OL'}
            onClick={() => run('insertOrderedList')}
          />

          <Divider />

          <ToolButton label="عريض" icon={Bold} pressed={active.bold} onClick={() => run('bold')} />
          <ToolButton
            label="مائل"
            icon={Italic}
            pressed={active.italic}
            onClick={() => run('italic')}
          />
          <ToolButton label="إضافة رابط" icon={LinkIcon} onClick={insertLink} />
          <ToolButton
            label="إزالة الرابط"
            icon={Unlink}
            disabled={!active.link}
            onClick={() => run('unlink')}
          />

          <Divider />

          <ToolButton label="إدراج صورة" icon={ImageIcon} onClick={() => setPickerOpen(true)} />

          <Divider />

          <ToolButton label="تراجع" icon={Undo2} onClick={() => run('undo')} />
          <ToolButton label="إعادة" icon={Redo2} onClick={() => run('redo')} />
        </div>

        {/* The surface. `dir="rtl"` is inherited from the document,
              but it is stated here because this box is also where
              pasted LTR content lands and the base direction must be
              the article's, not the paste's. */}
        <div
          ref={editorRef}
          className="admin-richtext min-h-72 px-4 py-3 text-sm leading-relaxed text-ink focus:outline-none"
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          dir="rtl"
          onInput={emit}
          onBlur={emit}
          onPaste={handlePaste}
          onKeyUp={syncActive}
          onMouseUp={syncActive}
        />
      </div>

      {hint ? <p className="text-xs leading-relaxed text-ink-muted">{hint}</p> : null}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={insertImage}
        title="إدراج صورة في النص"
      />
    </div>
  );
}

/** `queryCommandState` throws in some engines when nothing is focused. */
function safeQuery(command) {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

function toParagraphs(chunks) {
  return chunks
    .map((chunk) => `<p>${chunk.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
    .join('');
}

/** Structural equality, cheap enough at article length. */
function sameBlocks(a, b) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

function ToolButton({ label, icon: Icon, onClick, pressed = false, disabled = false }) {
  return (
    <button
      type="button"
      // `onMouseDown` + preventDefault, not `onClick`: clicking a
      // button blurs the editor and collapses the selection, so by
      // the time a click handler ran there would be nothing to format.
      onMouseDown={(event) => {
        event.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md transition-colors duration-(--dur-fast)',
        'hover:bg-[var(--state-hover-tint)] focus-visible:outline-none focus-visible:shadow-focus',
        'disabled:pointer-events-none disabled:opacity-40',
        pressed ? 'bg-brand-500/15 text-brand-200' : 'text-ink-muted hover:text-ink',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-[var(--border-subtle)]" />;
}

export default RichTextEditor;
