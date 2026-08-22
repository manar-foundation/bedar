import { useEffect } from 'react';

import { useContent } from '@context/ContentContext.jsx';
import { buildOrganizationSchema } from '@utils/schema.js';

/* ================================================================
   ORGANIZATION SCHEMA — site-wide JSON-LD, built from the dashboard.

   CLIENT NOTES §6
   ----------------------------------------------------------------
   "Make every Schema setting and value currently in the page
    editable from the dashboard… Ensure the Schema in this section is
    generated correctly and works site-wide as Organization Schema…
    The Organization Schema data must rely on the values saved in the
    dashboard, and NOT on fixed data inside the code."

   Which is why there is not one organisation fact in this file. Every
   value is read from `settings`, which `ContentContext` resolves from
   the `organization` and `social` rows of `site_settings` — the rows
   the "إعدادات SEO" screen writes. The only literals here are
   schema.org's own vocabulary (`@context`, `@type`, `sameAs`), which
   are the format, not the data.

   EMPTY MEANS ABSENT. A field the administrator has not filled in is
   omitted from the output rather than emitted as `""`. An empty
   string is not "unknown" to a validator — it is a declared, invalid
   value, and it is the usual reason a Rich Results test fails on a
   form that looks fine.

   ONE BLOCK, SITE-WIDE. Organization schema describes the publisher,
   not the page, so it is emitted once from the public shell. Per-page
   and per-article schema is generated from the content type and is
   deliberately not editable (Dashboard spec §6) — a hand-written
   `Article` block per post is how structured data drifts away from
   the content it claims to describe.
   ================================================================ */

const SCRIPT_ID = 'bedar-organization-schema';

export function SiteSchema() {
  const { settings } = useContent();

  useEffect(() => {
    const json = JSON.stringify(buildOrganizationSchema(settings), null, 2)
      // `</script>` inside a JSON string would close this element
      // early. JSON.stringify does not escape `<`, so it is escaped
      // here — the value is unchanged, `<` IS `<` to a parser.
      .replace(/</g, '\\u003c');

    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    // `textContent`, never `innerHTML`: the payload is a JSON string
    // and must stay one.
    script.textContent = json;

    return () => {
      // Removed on unmount so the dashboard (which mounts a
      // different shell) never carries the public site's schema.
      document.getElementById(SCRIPT_ID)?.remove();
    };
  }, [settings]);

  return null;
}

export default SiteSchema;
