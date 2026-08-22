import { Fragment } from 'react';

import { cn } from '@utils/cn.js';
import { itemSpans, safeHref, safeSrc, spansOf } from '@utils/richtext.js';

/* ================================================================
   RICH TEXT — renders a collection item's `body` block list.

   Blocks are structured data, not an HTML string. That is a
   deliberate choice: `dangerouslySetInnerHTML` on dashboard-authored
   content makes every editor account an XSS vector, and Supabase RLS
   does not help — an editor is authorised to write, they just should
   not be able to write <script>.

   Client note ١ turned the dashboard's side of this into a single
   Rich Text field, which added three things to render: inline marks
   (bold / italic / link), images with captions, and numbered lists.
   Nothing about the storage or the safety of the render changed —
   see `utils/richtext.js` for the model and for why an HTML string
   still never reaches this component.

   Block shapes come from `utils/richtext.js`.
   ================================================================ */

export function RichText({ blocks = [], className }) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case 'h2':
            return (
              <h2 key={key} className="mt-4 text-2xl font-bold text-ink">
                <Inline block={block} />
              </h2>
            );
          case 'h3':
            return (
              <h3 key={key} className="mt-2 text-xl font-semibold text-ink">
                <Inline block={block} />
              </h3>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                // border-s- flips: the rule sits on the right in RTL.
                className="border-s-4 border-brand-300 bg-brand-25 px-5 py-4 text-lg leading-relaxed text-ink dark:border-brand-500 dark:bg-brand-900/40"
              >
                <Inline block={block} />
              </blockquote>
            );
          case 'ul':
          case 'ol':
            return <List key={key} block={block} />;
          case 'image':
            return <Figure key={key} block={block} />;
          case 'p':
          default:
            return (
              <p key={key} className={paragraphClass(block)}>
                <Inline block={block} />
              </p>
            );
        }
      })}
    </div>
  );
}

/**
 * A shift+enter inside a paragraph is stored as a newline in the run
 * (see `collectSpans`), and a newline in HTML is whitespace. The
 * class is applied only to the paragraphs that actually contain one:
 * `pre-line` on every paragraph would make the incidental newlines
 * inside the migrated Webflow bodies render as breaks that were never
 * in the source.
 */
function paragraphClass(block) {
  const hasBreaks = spansOf(block).some((span) => span.text.includes('\n'));
  return cn('leading-relaxed text-ink-secondary', hasBreaks && 'whitespace-pre-line');
}

/** One block's inline runs — plain text, bold, italic, links. */
function Inline({ block }) {
  return <Runs spans={spansOf(block)} />;
}

function Runs({ spans }) {
  return spans.map((span, index) => {
    let node = span.text;

    if (span.bold) node = <strong className="font-semibold text-ink">{node}</strong>;
    if (span.italic) node = <em>{node}</em>;

    const href = safeHref(span.href);
    if (href) {
      // An external link opens in a new tab; an in-site one does not,
      // because leaving a tab behind for every internal link is how a
      // reader ends up with nine of them.
      const external = /^https?:\/\//i.test(href);
      node = (
        <a
          href={href}
          className="underline decoration-brand-300 underline-offset-4 transition-colors duration-(--dur-fast) hover:text-brand-200"
          {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        >
          {node}
        </a>
      );
    }

    return <Fragment key={index}>{node}</Fragment>;
  });
}

function List({ block }) {
  const items = block.items ?? [];
  const ordered = block.type === 'ol';
  const Tag = ordered ? 'ol' : 'ul';

  return (
    <Tag
      className={cn(
        'flex flex-col gap-2 ps-6 text-ink-secondary',
        ordered ? 'list-decimal' : 'list-disc',
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="leading-relaxed">
          <Runs spans={itemSpans(item)} />
        </li>
      ))}
    </Tag>
  );
}

/**
 * An in-body image. `loading="lazy"` because these sit far down a
 * long read, and the caption is a real `<figcaption>` so it is
 * associated with the image rather than reading as a stray sentence.
 */
function Figure({ block }) {
  const src = safeSrc(block.src);
  if (!src) return null;

  return (
    <figure className="flex flex-col gap-2">
      <span className="media-frame block overflow-hidden rounded-lg">
        <img
          src={src}
          alt={block.alt ?? ''}
          loading="lazy"
          decoding="async"
          className="w-full"
        />
      </span>
      {block.caption ? (
        <figcaption className="text-sm leading-relaxed text-ink-muted">{block.caption}</figcaption>
      ) : null}
    </figure>
  );
}

export default RichText;
