import { cn } from '@utils/cn.js';
import { normalizeBlocks } from '@utils/richtext.js';

/* ================================================================
   RICH TEXT — renders a collection item's `body`.

   Blocks are structured data, not an HTML string, and this file is
   why: every element below is a real React element with real props,
   so nothing an editor types can become markup. Storing the rich
   text editor's HTML and rendering it through
   `dangerouslySetInnerHTML` would make every editor account an XSS
   vector — Supabase RLS does not help, since an editor is
   authorised to write; they simply should not be able to write
   `<script>`.

   The authoring experience the client asked for in §1 — one field,
   everything in place — is `components/admin/RichTextEditor.jsx`.
   It writes this same block array, so the safety property here is
   unchanged.

   Two block vocabularies render through this component:

     current   { type:'p'|'h2'|'h3'|'h4'|'quote', content: run[] }
               { type:'ul'|'ol', items: run[][] }
               { type:'image', src, alt, caption }
               { type:'divider' }

     legacy    { type, text }  and  { type:'ul', items: string[] }

   `normalizeBlocks` folds the second into the first, so the ~40 kB
   of migrated Webflow copy in `content/collection-bodies.js` keeps
   rendering with no migration.
   ================================================================ */

/** One inline run — text, plus whichever of bold / italic / link it carries. */
function Run({ run }) {
  let node = run.text;
  if (run.bold) node = <strong className="font-semibold text-ink">{node}</strong>;
  if (run.italic) node = <em>{node}</em>;

  if (run.href) {
    // `safeHref` already refused anything that is not http(s), mail,
    // tel or same-site, so this is only about the target attributes.
    const external = /^https?:\/\//i.test(run.href);
    node = (
      <a
        href={run.href}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        className="text-brand-200 underline underline-offset-4 transition-colors duration-(--dur-fast) hover:text-brand-100"
      >
        {node}
      </a>
    );
  }
  return node;
}

/** A run array as React children. */
function Runs({ runs }) {
  return runs.map((run, index) => <Run key={index} run={run} />);
}

export function RichText({ blocks = [], className }) {
  const normalized = normalizeBlocks(blocks);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {normalized.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case 'h2':
            return (
              <h2 key={key} className="mt-4 text-2xl font-bold text-ink">
                <Runs runs={block.content} />
              </h2>
            );
          case 'h3':
            return (
              <h3 key={key} className="mt-2 text-xl font-semibold text-ink">
                <Runs runs={block.content} />
              </h3>
            );
          case 'h4':
            return (
              <h4 key={key} className="mt-1 text-lg font-semibold text-ink">
                <Runs runs={block.content} />
              </h4>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                // border-s- flips: the rule sits on the right in RTL.
                className="border-s-4 border-brand-300 bg-brand-25 px-5 py-4 text-lg leading-relaxed text-ink dark:border-brand-500 dark:bg-brand-900/40"
              >
                <Runs runs={block.content} />
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={key} className="flex list-disc flex-col gap-2 ps-6 text-ink-secondary">
                {block.items.map((item, position) => (
                  <li key={position} className="leading-relaxed">
                    <Runs runs={item} />
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className="flex list-decimal flex-col gap-2 ps-6 text-ink-secondary">
                {block.items.map((item, position) => (
                  <li key={position} className="leading-relaxed">
                    <Runs runs={item} />
                  </li>
                ))}
              </ol>
            );
          case 'image':
            return (
              <figure key={key} className="my-2 flex flex-col gap-2">
                <img
                  src={block.src}
                  alt={block.alt ?? ''}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-card border border-subtle bg-sunken object-cover"
                />
                {block.caption ? (
                  <figcaption className="text-sm text-ink-muted">{block.caption}</figcaption>
                ) : null}
              </figure>
            );
          case 'divider':
            return <hr key={key} className="my-2 border-0 border-t border-subtle" />;
          case 'p':
          default:
            return (
              <p key={key} className="leading-relaxed text-ink-secondary">
                <Runs runs={block.content} />
              </p>
            );
        }
      })}
    </div>
  );
}

export default RichText;
