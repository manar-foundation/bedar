/* ================================================================
   REALTIME — Postgres changes, straight off the WebSocket.

   `contentSync` makes a save visible in the browser that made it.
   This makes it visible on every OTHER device, without anyone
   touching the tab: Supabase Realtime pushes the row change, and we
   turn it into the same `publish()` call a local save would make.

   WHY A HAND-WRITTEN CLIENT AND NOT `supabase.channel()`
   ----------------------------------------------------------------
   Same reason `publicContent.js` speaks PostgREST by hand: the
   realtime API lives in `@supabase/supabase-js` (~53 kB gzipped),
   and CLAUDE.md's hard rule is that the package never reaches the
   public bundle. The wire protocol is Phoenix over JSON — a join
   frame, a heartbeat and a message envelope. That is ~120 lines,
   which is a far better trade than 53 kB on every visitor.

   FAIL-SAFE BY CONSTRUCTION. Realtime needs the tables added to the
   `supabase_realtime` publication (migration 0009). If that has not
   been pushed, if the socket is blocked by a proxy, or if the
   project has Realtime disabled, `onStatus('failed')` fires and
   `ContentContext` falls back to polling. Nothing here can break the
   site — it only ever ASKS for a refetch.
   ================================================================ */

import { env, hasSupabase } from '@utils/env.js';
import { publish } from './contentSync.js';

/** The tables whose changes the public site actually renders. */
const WATCHED = [
  'collection_items',
  'testimonials',
  'faq_items',
  'services',
  'pages',
  'page_fields',
  'navigation_items',
  'site_settings',
  'media',
];

const HEARTBEAT_MS = 25_000;
// Give up announcing "connected" if the join never lands; the caller
// starts polling instead of waiting forever on a socket that opened
// but was never accepted.
const JOIN_TIMEOUT_MS = 10_000;
const MAX_BACKOFF_MS = 30_000;

function socketUrl() {
  const base = env.supabaseUrl.replace(/^http/, 'ws');
  return `${base}/realtime/v1/websocket?apikey=${encodeURIComponent(env.supabaseAnonKey)}&vsn=1.0.0`;
}

/**
 * Subscribe to row changes on the watched tables.
 *
 * `onStatus` is called with 'connected' once the server accepts the
 * join, and 'failed' when the socket cannot be established or the
 * join is refused — that is the signal to start polling. Reconnects
 * are automatic with exponential backoff; a reconnect that succeeds
 * reports 'connected' again.
 *
 * Returns a teardown function.
 */
export function subscribeToChanges({ onStatus } = {}) {
  if (!hasSupabase || typeof WebSocket === 'undefined') {
    onStatus?.('failed');
    return () => {};
  }

  let socket = null;
  let heartbeat = null;
  let joinTimer = null;
  let retryTimer = null;
  let attempt = 0;
  let closed = false;
  let ref = 0;

  const nextRef = () => String(++ref);

  function clearTimers() {
    clearInterval(heartbeat);
    clearTimeout(joinTimer);
    heartbeat = null;
    joinTimer = null;
  }

  function scheduleReconnect() {
    if (closed) return;
    // 1s, 2s, 4s … capped. `attempt` is reset on a successful join,
    // so a flaky network does not degrade into a 30s hole forever.
    const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
    attempt += 1;
    retryTimer = setTimeout(connect, delay);
  }

  function connect() {
    if (closed) return;

    try {
      socket = new WebSocket(socketUrl());
    } catch {
      onStatus?.('failed');
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          topic: 'realtime:public:bedar-content',
          event: 'phx_join',
          ref: nextRef(),
          payload: {
            config: {
              // No presence, no broadcast — this connection exists
              // only to hear about row changes.
              postgres_changes: WATCHED.map((table) => ({
                event: '*',
                schema: 'public',
                table,
              })),
            },
            // RLS is evaluated against this token, exactly as it is
            // for the PostgREST reads. Anon sees published rows.
            access_token: env.supabaseAnonKey,
          },
        }),
      );

      heartbeat = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({ topic: 'phoenix', event: 'heartbeat', ref: nextRef(), payload: {} }),
          );
        }
      }, HEARTBEAT_MS);

      // The socket being open is not the same as the join being
      // accepted — a missing publication opens fine and then refuses.
      joinTimer = setTimeout(() => onStatus?.('failed'), JOIN_TIMEOUT_MS);
    };

    socket.onmessage = (event) => {
      let frame;
      try {
        frame = JSON.parse(event.data);
      } catch {
        return;
      }

      /* A `phx_reply: ok` only means the CHANNEL was joined. The
         replication subscription is confirmed separately, in a
         `system` frame — and it is the half that fails when the
         tables are not in the `supabase_realtime` publication
         (migration 0009). Treating the join as success would leave
         the site reporting "connected" while receiving nothing and
         never falling back to polling, so the join reply only clears
         the retry counter. */
      if (frame.event === 'phx_reply') {
        if (frame.payload?.status !== 'ok') onStatus?.('failed');
        return;
      }

      if (frame.event === 'system') {
        clearTimeout(joinTimer);
        joinTimer = null;
        if (frame.payload?.status === 'error') {
          // "Unable to subscribe to changes with given parameters."
          // Not retryable — the publication has to change server-side.
          onStatus?.('failed');
        } else {
          attempt = 0;
          onStatus?.('connected');
        }
        return;
      }

      if (frame.event === 'postgres_changes') {
        const table = frame.payload?.data?.table;
        // `publish` fans out to the same subscribers a local save
        // reaches, so there is one refetch path and not two.
        if (table) publish(table);
      }
    };

    socket.onerror = () => onStatus?.('failed');

    socket.onclose = () => {
      clearTimers();
      if (!closed) {
        onStatus?.('failed');
        scheduleReconnect();
      }
    };
  }

  connect();

  return () => {
    closed = true;
    clearTimers();
    clearTimeout(retryTimer);
    // 1000 = normal closure; anything else makes the server log an error.
    try {
      socket?.close(1000);
    } catch {
      /* already gone */
    }
  };
}

export default { subscribeToChanges };
