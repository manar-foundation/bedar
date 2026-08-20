/* ================================================================
   CONTENT SYNC — "something was published, re-read it".

   The dashboard writes to Supabase; `ContentContext` holds the copy
   the public site is currently rendering. Nothing connected the two,
   so a save was invisible until the reader happened to blur and
   refocus the tab. This module is that connection.

   NO IMPORTS, DELIBERATELY. `db.js` (admin, pulls the ~53 kB
   Supabase client) and `ContentContext.jsx` (public, must not) both
   import this file, so it has to be safe on the public side —
   CLAUDE.md's bundle rule. It is plain browser API and nothing else.

   Three transports, each covering what the previous one cannot:

     same tab      a direct call to the local subscribers. A
                   BroadcastChannel does NOT deliver to the context
                   that posted, and the dashboard lives in the same
                   React tree as the public site (`ContentProvider`
                   wraps `AppRoutes`), so this is the case that makes
                   an edit visible the moment you navigate back.

     other tabs    BroadcastChannel, with a `localStorage` write as
                   the fallback for anything that lacks it — the
                   `storage` event fires in every OTHER tab of the
                   same origin, which is exactly the shape needed.

     other devices not this file's job. `realtime.js` listens to
                   Postgres and calls `publish()` here, so every
                   transport converges on the same subscriber list.
   ================================================================ */

/** Bumped into localStorage so the `storage` event always has a new value. */
const STORAGE_KEY = 'bedar:content-changed';
const CHANNEL_NAME = 'bedar-content';

/**
 * Which tables feed which part of the rendered site.
 *
 * A save to `page_fields` does not need the article list re-read, and
 * an article does not need the navigation re-read. Subscribers get
 * the affected SCOPES so `ContentContext` can refetch a third of
 * itself instead of all of it.
 */
const TABLE_SCOPES = {
  collection_items: 'collections',
  testimonials: 'testimonials',
  faq_items: 'faq',
  services: 'services',
  pages: 'pages',
  page_fields: 'pages',
  navigation_items: 'navigation',
  site_settings: 'settings',
  // A replaced image changes the row that points at it, not the
  // bucket — but an alt-text edit touches `media` alone, and the
  // image rows are embedded into all three of these reads.
  media: 'collections,pages,services',
};

export const ALL_SCOPES = [
  'collections',
  'testimonials',
  'faq',
  'services',
  'pages',
  'navigation',
  'settings',
];

/** Table name → the scopes that have to be re-read. Unknown ⇒ everything. */
export function scopesForTable(table) {
  const mapped = TABLE_SCOPES[table];
  if (!mapped) return ALL_SCOPES;
  return mapped.split(',');
}

const subscribers = new Set();

let channel = null;
function getChannel() {
  if (channel !== null) return channel;
  try {
    channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL_NAME) : false;
  } catch {
    channel = false;
  }
  if (channel) channel.onmessage = (event) => deliver(event.data?.scopes);
  return channel;
}

function deliver(scopes) {
  const list = Array.isArray(scopes) && scopes.length ? scopes : ALL_SCOPES;
  for (const subscriber of subscribers) {
    // One throwing subscriber must not stop the others — this runs
    // from a socket callback where nothing would catch it.
    try {
      subscriber(list);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Announce that `table` changed. Called after every successful
 * dashboard write (`db.mutate`) and by the realtime listener.
 *
 * Fire-and-forget by design: a save must not fail because a
 * BroadcastChannel is unavailable in some embedded webview.
 */
export function publish(table) {
  const scopes = scopesForTable(table);

  deliver(scopes);

  const bus = getChannel();
  if (bus) {
    try {
      bus.postMessage({ scopes, at: Date.now() });
      return;
    } catch {
      /* fall through to the storage transport */
    }
  }

  try {
    // Value must differ every time or Chrome skips the event. Only
    // reached when there is no BroadcastChannel — sending on both
    // would deliver twice to every tab that has both.
    localStorage.setItem(STORAGE_KEY, `${Date.now()}:${scopes.join(',')}`);
  } catch {
    /* private mode, quota, or no storage — same-tab delivery still happened */
  }
}

/**
 * Listen for changes. Returns the unsubscribe function.
 *
 * `handler(scopes)` receives the list of affected scopes, never an
 * empty one — a caller can always treat it as "re-read these".
 */
/**
 * Wire the cross-tab transport once per document, not once per
 * subscriber — both listeners fan out to the whole subscriber set,
 * so registering twice would refetch twice for one save.
 */
let transportReady = false;
function ensureTransport() {
  if (transportReady) return;
  transportReady = true;

  // The channel reaches every other tab on its own. `storage` is the
  // fallback for browsers without it, wired up only in that case.
  if (getChannel() || typeof window === 'undefined') return;

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    deliver(event.newValue.split(':').slice(1).join(':').split(',').filter(Boolean));
  });
}

export function subscribe(handler) {
  subscribers.add(handler);
  ensureTransport();
  return () => subscribers.delete(handler);
}

export default { publish, subscribe, scopesForTable, ALL_SCOPES };
