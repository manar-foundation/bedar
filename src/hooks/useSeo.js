import { useEffect } from 'react';

/* ================================================================
   useSeo — per-page <title> and meta description.

   This app is a client-rendered SPA, so the document head has to be
   updated on navigation; `index.html` only carries the defaults.
   React 18 has no built-in hoisting for <title> (that landed in 19),
   and pulling in react-helmet for two tags is not worth 4 kB.

   Phase 6 note: crawlers that do not execute JS see only the static
   `index.html`. Prerendering — Netlify's own, or a build-time
   crawl — is the fix, and it is a deploy-pipeline concern, not a
   component one. What matters here is that every page's title and
   description are DATA (`pages.js`), so whatever mechanism renders
   them later reads from the same source the dashboard edits.

   The meta tag is created if `index.html` does not already carry
   one, so the description is never silently dropped.
   ================================================================ */

const DEFAULT_TITLE = 'بدار | منصة بدار للريادة المجتمعية';

export function useSeo({ title, description } = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title || DEFAULT_TITLE;

    let tag = document.querySelector('meta[name="description"]');
    let created = false;
    if (!tag && description) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
      created = true;
    }

    const previousDescription = tag?.getAttribute('content') ?? '';
    if (tag && description) tag.setAttribute('content', description);

    return () => {
      document.title = previousTitle;
      if (!tag) return;
      if (created) tag.remove();
      else tag.setAttribute('content', previousDescription);
    };
  }, [title, description]);
}

export default useSeo;
