import { cn } from '@utils/cn.js';

/* ================================================================
   TABLE — the dashboard's list surface (pages, collections, media,
   redirects, users, version history).

   RTL: `text-start` on every cell, so columns align to the right
   here and to the left if the admin is ever run LTR. Columns can opt
   into `align: 'end'` for numeric columns, and `numeric: true` wraps
   the cell in `.ltr-run` so a figure never gets bidi-reordered next
   to Arabic text.

   The horizontal scroll lives on the wrapper, per the house rule
   that wide content scrolls inside its own container and the page
   body never scrolls sideways.
   ================================================================ */

export function Table({
  columns = [],
  rows = [],
  getRowKey,
  striped = false,
  dense = false,
  caption,
  empty = 'لا توجد بيانات',
  className,
}) {
  const cellPadding = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      className={cn('w-full overflow-x-auto rounded-lg border border-subtle bg-surface', className)}
    >
      <table className="w-full border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}

        {/* Not sticky, deliberately: the wrapper sets `overflow-x`,
            which computes `overflow-y` to `auto` as well, so a sticky
            head would anchor to a container that never scrolls
            vertically and simply never move. */}
        <thead className="bg-sunken">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap border-b border-default text-[13px] font-semibold tracking-wide text-ink-secondary',
                  column.align === 'end' ? 'text-end' : 'text-start',
                  cellPadding,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length || 1}
                className={cn('text-center text-ink-muted', cellPadding)}
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : (row.id ?? rowIndex)}
                className={cn(
                  'border-b border-subtle transition-colors duration-(--dur-fast) last:border-b-0',
                  'hover:bg-[var(--state-hover-tint)]',
                  striped && rowIndex % 2 === 1 && 'bg-sunken',
                )}
              >
                {columns.map((column) => {
                  const value = column.render ? column.render(row, rowIndex) : row[column.key];
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'text-ink',
                        column.align === 'end' ? 'text-end' : 'text-start',
                        cellPadding,
                      )}
                    >
                      {column.numeric ? <span className="ltr-run">{value}</span> : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
