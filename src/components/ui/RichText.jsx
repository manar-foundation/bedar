import { cn } from '@utils/cn.js';

/* ================================================================
   RICH TEXT — renders a collection item's `body` block list.

   Blocks are structured data, not an HTML string. That is a
   deliberate choice: `dangerouslySetInnerHTML` on dashboard-authored
   content makes every editor account an XSS vector, and Supabase RLS
   does not help — an editor is authorised to write, they just should
   not be able to write <script>.

   Block shapes come from `content/collections.js`.
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
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={key} className="mt-2 text-xl font-semibold text-ink">
                {block.text}
              </h3>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                // border-s- flips: the rule sits on the right in RTL.
                className="border-s-4 border-brand-300 bg-brand-25 px-5 py-4 text-lg leading-relaxed text-ink dark:border-brand-500 dark:bg-brand-900/40"
              >
                {block.text}
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={key} className="flex list-disc flex-col gap-2 ps-6 text-ink-secondary">
                {block.items.map((item) => (
                  <li key={item} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case 'p':
          default:
            return (
              <p key={key} className="leading-relaxed text-ink-secondary">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}

export default RichText;
