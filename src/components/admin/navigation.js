import {
  FileText,
  Folders,
  Globe,
  History,
  Image,
  Inbox,
  LayoutDashboard,
  Plug,
  Settings as SettingsIcon,
  ShieldCheck,
  Shuffle,
  Users as UsersIcon,
} from 'lucide-react';

/* ================================================================
   THE DASHBOARD'S SECTION REGISTRY — one list, two consumers.

   `layouts/AdminLayout.jsx` renders it as the navigation rail and
   `pages/admin/Dashboard.jsx` renders it as the "اختصارات" grid.
   Both used to keep their OWN copy, and the copies drifted: the
   Dashboard's list never gained "التكاملات" when that screen was
   built, and still said "الإعدادات" months after the rail was
   renamed to "إعدادات SEO" (client notes §6). A section was
   reachable, routed and in the sidebar, yet invisible on the landing
   screen — which is exactly the bug a second hand-maintained list
   produces, silently and every time.

   So a screen is added HERE, once. `routes.jsx` still owns the
   routing; this file owns what the chrome says about it.

   NOTHING IS ROLE-GATED. Both surfaces show every section to every
   signed-in account, deliberately: an editor who cannot write a
   setting still sees the screen and the reason ("هذه الإعدادات
   للمديرين فقط"), because a hidden screen reads as a missing feature
   and gets reported as one. The real boundary is `min_role` in SQL —
   see `services/settingsService.js` and the note in `Integrations`.
   ================================================================ */

export const ADMIN_SECTIONS = [
  {
    title: 'المحتوى',
    items: [
      // `home` is the landing screen itself: it anchors the rail but
      // is never offered as a shortcut FROM that same screen.
      { to: '/admin', end: true, home: true, label: 'لوحة التحكم', icon: LayoutDashboard },
      { to: '/admin/pages', label: 'الصفحات', icon: FileText, shortcut: true },
      { to: '/admin/global', label: 'الهيدر والفوتر', icon: Globe, shortcut: true },
      { to: '/admin/collections/articles', label: 'المجموعات', icon: Folders, shortcut: true },
      {
        to: '/admin/media',
        label: 'مكتبة الوسائط',
        shortLabel: 'الوسائط',
        icon: Image,
        shortcut: true,
      },
      { to: '/admin/submissions', label: 'طلبات النماذج', icon: Inbox, shortcut: true },
    ],
  },
  {
    title: 'الموقع',
    items: [
      { to: '/admin/redirects', label: 'إعادة التوجيه', icon: Shuffle, shortcut: true },
      { to: '/admin/integrations', label: 'التكاملات', icon: Plug, shortcut: true },
      { to: '/admin/history', label: 'سجل النسخ', icon: History },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { to: '/admin/users', label: 'المستخدمون', icon: UsersIcon },
      { to: '/admin/security', label: 'الأمان', icon: ShieldCheck },
      // Renamed from "الإعدادات" per client notes §6: this screen is
      // where the site's general SEO settings live — the Organization
      // schema, robots.txt and the sitemap — so it says so.
      { to: '/admin/settings', label: 'إعدادات SEO', icon: SettingsIcon, shortcut: true },
    ],
  },
];

/** Every section, rail order, flattened. */
export const ADMIN_ITEMS = ADMIN_SECTIONS.flatMap((section) => section.items);

/**
 * The order the shortcut grid prefers, by path.
 *
 * It is a PREFERENCE, not the list — the list is the `shortcut` flag
 * above. A flagged screen missing from here is still rendered,
 * appended in rail order, so flagging one is enough to make it
 * appear. Reordering here is cosmetic; forgetting to is harmless.
 *
 * Submissions leads because it is the only screen where somebody
 * outside the organisation is waiting on an answer.
 */
const SHORTCUT_ORDER = [
  '/admin/submissions',
  '/admin/pages',
  '/admin/collections/articles',
  '/admin/media',
  '/admin/global',
  '/admin/redirects',
  '/admin/settings',
  '/admin/integrations',
];

/**
 * The landing screen's shortcut grid.
 *
 * The grid is a curated subset, not every screen: it is the set an
 * editor reaches for daily, and the account-management screens
 * (المستخدمون، الأمان، سجل النسخ) are deliberately rail-only. The
 * curation lives on the section itself, so there is still exactly one
 * list — which is the whole point. Adding a screen is one line in
 * `ADMIN_SECTIONS`, and `shortcut: true` on that same line is what
 * puts it here. A label or a path can no longer disagree between the
 * two surfaces, because there is only one of each.
 *
 * `shortLabel` is used where a section has one — the grid cells are
 * two to a row and "مكتبة الوسائط" wraps in them, while the rail has
 * the width for the full name.
 */
export const ADMIN_SHORTCUTS = ADMIN_ITEMS.filter((item) => item.shortcut && !item.home)
  // The rail position is captured BEFORE any copying, because it is
  // what ranks a screen the order list does not mention — and an
  // `indexOf` against a spread copy finds nothing and silently ranks
  // every unlisted screen the same.
  .map((item, railIndex) => ({ item, railIndex }))
  .sort((a, b) => {
    const rank = ({ item, railIndex }) => {
      const index = SHORTCUT_ORDER.indexOf(item.to);
      // Unlisted screens sort after every listed one, keeping their
      // rail order relative to each other.
      return index === -1 ? SHORTCUT_ORDER.length + railIndex : index;
    };
    return rank(a) - rank(b);
  })
  .map(({ item }) => ({ ...item, label: item.shortLabel ?? item.label }));

/**
 * The label for the current screen, for the top bar.
 *
 * Longest matching prefix wins, so `/admin/pages/7` still resolves
 * to "الصفحات" while `/admin` itself only matches itself.
 */
export function currentSectionLabel(pathname) {
  let best = null;
  for (const item of ADMIN_ITEMS) {
    const matches = item.end ? pathname === item.to : pathname.startsWith(item.to);
    if (matches && (!best || item.to.length > best.to.length)) best = item;
  }
  return best?.label ?? 'لوحة التحكم';
}
