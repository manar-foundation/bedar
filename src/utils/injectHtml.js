/* ================================================================
   INJECTING DASHBOARD-AUTHORED MARKUP INTO THE DOCUMENT.
   (Client note ٥ — Head Code / Footer Code)

   "يجب حفظ الأكواد كما يتم إدخالها دون تعديل محتواها … يجب أن تدعم
    الحقول أكواد JavaScript وHTML مثل Scripts وأكواد أدوات التحليل
    والتتبع … يجب ألا يتم إظهار هذه الحقول أو الأكواد للزوار كنص
    داخل الصفحة، وإنما تنفيذها في المواقع المخصصة لها داخل الكود."

   Verbatim, executed, in the right place, never printed as text.
   That last clause is why this file exists rather than a
   `dangerouslySetInnerHTML` somewhere: assigning `innerHTML` puts a
   <script> in the DOM but the browser will NOT run it (HTML5 §
   "script elements inserted using innerHTML do not execute"), so an
   analytics snippet pasted into the dashboard would sit there inert
   and look like a broken feature. Each script therefore has to be
   re-created as a fresh element and appended.

   IS THIS NOT AN XSS SINK?
   ----------------------------------------------------------------
   It is arbitrary script execution by design — that is what the
   field IS, and the same is true of the GTM container it sits next
   to. Three things bound it, and they are the reason it is
   acceptable here while dashboard-authored ARTICLE HTML is not:

     · Only an admin can write it. `site_settings.integrations` is
       `min_role = 'admin'` and the policy is enforced in SQL, so it
       is not reachable by an editor — the account type this project
       assumes may be compromised.
     · An admin who can set this can already deploy the site. There
       is no privilege here they do not already have.
     · An ARTICLE is written by an editor, which is exactly why
       article bodies are structured blocks and never HTML. The two
       decisions are consistent: the boundary is who is trusted, not
       whether the string is called "code".

   `Sec-Fetch`-style CSP is not in play — the site ships no CSP
   header, and adding one would break this feature and the GTM
   container together.
   ================================================================ */

/** Marks every node this module owns, so a re-run can clean up. */
const OWNER_ATTRIBUTE = 'data-bedar-injected';

/**
 * Re-create a <script> so the browser actually runs it.
 *
 * `cloneNode` is not enough: a script element that has already been
 * marked "already started" (which parsing does) stays inert however
 * many times it is moved. A brand-new element with the same
 * attributes and the same body is the only thing that executes.
 */
function reviveScript(source) {
  const script = document.createElement('script');
  for (const { name, value } of source.attributes) script.setAttribute(name, value);
  script.text = source.textContent ?? '';
  return script;
}

/**
 * Insert an HTML fragment into `target`, executing any scripts.
 *
 * Returns a cleanup function that removes exactly what it added —
 * so a settings change swaps the snippet instead of stacking a
 * second copy of it on top of the first.
 *
 * `slot` distinguishes one injection point from another (head code
 * vs footer code), so cleaning up one never touches the other.
 */
export function injectHtml(html, target, slot) {
  const markup = String(html ?? '').trim();
  if (!markup || !target) return () => {};

  // Parsed in a detached document: nothing here is live, so an
  // <img onerror> in the markup does not fire during parsing and a
  // <script> does not run until we deliberately revive it below.
  const parsed = new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html').body;

  const added = [];
  for (const node of [...parsed.childNodes]) {
    const element =
      node.nodeType === 1 && node.tagName === 'SCRIPT' ? reviveScript(node) : node.cloneNode(true);

    if (element.nodeType === 1) element.setAttribute(OWNER_ATTRIBUTE, slot);
    target.appendChild(element);
    added.push(element);
  }

  return () => {
    for (const element of added) element.remove();
  };
}

/**
 * Create or update one <meta> in the head, and restore it after.
 *
 * Used for the Search Console verification tag, which is a single
 * meta whose CONTENT changes rather than a fragment to append.
 */
export function setMeta(name, content) {
  const value = String(content ?? '').trim();
  const existing = document.head.querySelector(`meta[name="${CSS.escape(name)}"]`);

  if (!value) {
    // Nothing configured. Remove only a tag we created ourselves —
    // a hand-written one in index.html is not ours to delete.
    if (existing?.hasAttribute(OWNER_ATTRIBUTE)) existing.remove();
    return () => {};
  }

  if (existing) {
    const previous = existing.getAttribute('content');
    existing.setAttribute('content', value);
    return () => existing.setAttribute('content', previous ?? '');
  }

  const tag = document.createElement('meta');
  tag.setAttribute('name', name);
  tag.setAttribute('content', value);
  tag.setAttribute(OWNER_ATTRIBUTE, 'meta');
  document.head.appendChild(tag);
  return () => tag.remove();
}

/**
 * A JSON-LD block in the head.
 *
 * `JSON.stringify` is the escaping: the payload is a plain object
 * built from settings, never a string spliced into markup, so no
 * value in it can close the <script> tag. The one sequence that can
 * — a literal `</script>` inside a string value — is neutralised
 * below, which is the standard treatment for inline JSON.
 */
export function setJsonLd(id, data) {
  const previous = document.head.querySelector(`script[data-bedar-jsonld="${CSS.escape(id)}"]`);
  previous?.remove();

  if (!data) return () => {};

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-bedar-jsonld', id);
  script.text = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
  document.head.appendChild(script);

  return () => script.remove();
}

export { OWNER_ATTRIBUTE };
