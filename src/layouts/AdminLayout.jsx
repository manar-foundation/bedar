import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ExternalLink,
  FileText,
  Folders,
  Globe,
  HeartHandshake,
  History,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Settings as SettingsIcon,
  ShieldCheck,
  Shuffle,
  Users as UsersIcon,
  X,
} from 'lucide-react';

import { Spiral } from '@components/ui/Spiral.jsx';
import { useAuth } from '@context/AuthContext.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { ROLES } from '@utils/constants.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   THE DASHBOARD SHELL

   Three parts: a dark teal navigation rail, a glass top bar, and the
   screen itself. The rail carries the brand — it is the same
   `--hero-bg` field the site's hero and footer sit on, with the same
   mint glow — because an editor spends their day in this chrome and
   nothing else in a content tool says which product it belongs to.
   The treatments live in `styles/admin.css`; see the header there
   for why the dark surface is allowed here.

   DIRECTION. The rail is a drawer under `lg` and pinned from `lg`
   up. `start-0` is logical and lands it on the right in RTL, but
   `translate-x-*` is a physical transform that Tailwind does not
   flip — so the off-screen direction is stated per writing mode.
   ================================================================ */

const NAV_SECTIONS = [
  {
    title: 'المحتوى',
    items: [
      { to: '/admin', end: true, label: 'لوحة التحكم', icon: LayoutDashboard },
      { to: '/admin/pages', label: 'الصفحات', icon: FileText },
      { to: '/admin/global', label: 'الهيدر والفوتر', icon: Globe },
      { to: '/admin/collections/articles', label: 'المجموعات', icon: Folders },
      { to: '/admin/services', label: 'الخدمات', icon: HeartHandshake },
      { to: '/admin/media', label: 'مكتبة الوسائط', icon: Image },
    ],
  },
  {
    title: 'الموقع',
    items: [
      { to: '/admin/redirects', label: 'إعادة التوجيه', icon: Shuffle },
      { to: '/admin/integrations', label: 'التكاملات', icon: Plug },
      { to: '/admin/history', label: 'سجل النسخ', icon: History },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { to: '/admin/users', label: 'المستخدمون', icon: UsersIcon },
      { to: '/admin/security', label: 'الأمان', icon: ShieldCheck },
      { to: '/admin/settings', label: 'الإعدادات', icon: SettingsIcon },
    ],
  },
];

const FLAT_NAV = NAV_SECTIONS.flatMap((section) => section.items);

/**
 * The label for the current screen, for the top bar.
 *
 * Longest matching prefix wins, so `/admin/pages/7` still resolves
 * to "الصفحات" while `/admin` itself only matches itself.
 */
function currentSectionLabel(pathname) {
  let best = null;
  for (const item of FLAT_NAV) {
    const matches = item.end ? pathname === item.to : pathname.startsWith(item.to);
    if (matches && (!best || item.to.length > best.to.length)) best = item;
  }
  return best?.label ?? 'لوحة التحكم';
}

/** First letter of the display name, for the avatar disc. */
function initialOf(name) {
  return String(name ?? '')
    .trim()
    .charAt(0)
    .toUpperCase();
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { source } = useContent();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Close the drawer whenever the route changes — including when a
  // screen navigates on its own (a save that redirects, a 404
  // bounce), which a per-link `onClick` would miss.
  //
  // Adjusted during render against the previous value rather than in
  // an effect: `react-hooks/set-state-in-effect` is enforced here,
  // and an effect would paint one frame of the new screen with the
  // drawer still open over it.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  // Escape closes the drawer — it is a modal surface under `lg`.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  const displayName = profile?.full_name || user?.email || '';
  const isAdmin = profile?.role === ROLES.ADMIN;
  // The dashboard home is `/admin` itself; every other screen is a
  // sub-section, and gets a "back to dashboard" control + breadcrumb.
  const isDashboardHome = pathname === '/admin';
  const sectionLabel = currentSectionLabel(pathname);

  return (
    <div data-theme="dark" className="admin-canvas flex min-h-dvh bg-app">
      {/* Backdrop for the mobile drawer */}
      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            aria-label="إغلاق القائمة الجانبية"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-[var(--bg-overlay)] backdrop-blur-[2px] lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          'admin-rail fixed inset-y-0 start-0 z-50 flex w-[17.5rem] shrink-0 flex-col',
          'transition-transform duration-(--dur-base) ease-(--ease-standard) lg:static lg:translate-x-0',
          open ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full',
        )}
      >
        {/* ── Brand lockup ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 px-5 pt-6 pb-5">
          <NavLink to="/admin" className="group flex items-center gap-3 no-underline">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 transition-colors duration-(--dur-fast) group-hover:bg-white/15">
              <Spiral className="size-5 text-brand-200" />
            </span>
            <span className="flex flex-col">
              <span className="text-[15px] leading-tight font-bold text-white">لوحة تحكم بدار</span>
              <span className="text-[11px] leading-tight font-medium text-brand-200/70">
                إدارة محتوى الموقع
              </span>
            </span>
          </NavLink>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة الجانبية"
            className="-me-1 inline-flex size-9 items-center justify-center rounded-md text-brand-100/70 transition-colors duration-(--dur-fast) hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <hr className="admin-rail-divider mx-5" />

        {/* ── Sections ─────────────────────────────────────── */}
        <nav
          aria-label="تنقل لوحة التحكم"
          className="admin-rail-scroll flex-1 overflow-y-auto px-3 py-5"
        >
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-6 last:mb-0">
              <h2 className="px-3 pb-2 text-[11px] font-semibold tracking-[0.12em] text-brand-200/55 uppercase">
                {section.title}
              </h2>
              <ul className="flex flex-col gap-0.5">
                {section.items.map(({ to, end, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink to={to} end={end} className="admin-nav-item">
                      <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Account ──────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-4">
          <hr className="admin-rail-divider mx-2 mb-3" />

          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <span
              aria-hidden="true"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-200/15 text-sm font-bold text-brand-200 ring-1 ring-brand-200/25"
            >
              {initialOf(displayName)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-white">
                {profile?.full_name || 'حساب بدار'}
              </span>
              <span className="bidi-auto truncate text-[11px] text-brand-100/55">
                {isAdmin ? 'مدير' : 'محرّر'}
                {user?.email ? ` · ${user.email}` : ''}
              </span>
            </span>
          </div>

          {/* Sign-out is a prominent, distinct control — not another
              muted nav row — so it never gets lost at the foot of the
              rail. Bordered + danger-tinted on hover. */}
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-(--dur-fast) hover:border-error-400/60 hover:bg-error-500/20 hover:text-white"
          >
            <LogOut className="mirror-rtl size-[1.125rem] shrink-0" aria-hidden="true" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-subtle bg-[var(--glass-bg)] px-4 backdrop-blur-xl sm:gap-3 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="فتح القائمة الجانبية"
            aria-expanded={open}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-ink transition-colors duration-(--dur-fast) hover:bg-[var(--state-hover-tint)] lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          {/* Back to the dashboard home — a clear, always-available way
              out of any sub-section (Admin brief §4). Hidden on the
              dashboard home itself, where it would point at the current
              page. ArrowRight unmirrored: in RTL "back" is rightward. */}
          {!isDashboardHome ? (
            <NavLink
              to="/admin"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-subtle bg-surface/60 ps-2 pe-2.5 text-[13px] font-medium text-ink-secondary no-underline transition-colors duration-(--dur-fast) hover:border-default hover:bg-[var(--state-hover-tint)] hover:text-ink"
            >
              <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </NavLink>
          ) : null}

          {/* Where you are. The rail says it too, but the rail is off
              screen on a phone and behind the fold on a long form. On a
              sub-section it reads as a breadcrumb from the home. */}
          <nav aria-label="مسار التنقل" className="flex min-w-0 items-center gap-1.5">
            <Spiral className="size-4 shrink-0 text-brand-400/70 lg:hidden" />
            {isDashboardHome ? (
              <span className="truncate text-sm font-semibold text-ink">{sectionLabel}</span>
            ) : (
              <>
                <span className="hidden shrink-0 text-sm text-ink-muted lg:inline">
                  لوحة التحكم
                </span>
                <ChevronLeft
                  className="hidden size-4 shrink-0 text-ink-muted lg:inline"
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-semibold text-ink">{sectionLabel}</span>
              </>
            )}
          </nav>

          {source === 'local-seed' ? (
            <span className="ms-2 hidden rounded-full bg-warning-100 px-3 py-1 text-xs font-medium text-warning-700 md:inline">
              المحتوى من الملفات المحلية — Supabase غير مهيأ
            </span>
          ) : null}

          <div className="ms-auto flex items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-ink-secondary no-underline transition-colors duration-(--dur-fast) hover:bg-[var(--state-hover-tint)] hover:text-ink"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">معاينة الموقع</span>
            </a>

            {/* Always-visible sign-out — the rail's control is off
                screen on a phone and behind a long form on desktop, so
                the header carries one too (Admin brief §4). */}
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-subtle px-3 text-[13px] font-medium text-ink-secondary transition-colors duration-(--dur-fast) hover:border-error-400/60 hover:bg-error-500/10 hover:text-error-600"
            >
              <LogOut className="mirror-rtl size-4" aria-hidden="true" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </header>

        {/* The same 8px rise the public site uses between routes.
            Keyed on the path so it replays per screen, and small
            enough not to fight a form that is already on screen. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="flex-1 px-4 py-8 lg:px-8"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
