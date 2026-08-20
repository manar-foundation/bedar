/* ================================================================
   SERVICE MARKS — the line icon drawn on a service card.

   The homepage services band draws one mark per service. It used to
   be a `SERVICE_ICONS` map inside `Home.jsx`, keyed by the service's
   id, which meant the mark was code and could only change in a
   deploy. Now `services.icon` carries the NAME of the mark and this
   module is the allowlist that name is resolved against — so the
   dashboard can offer a real choice without ever handing a component
   name straight to the renderer.

   WHY AN ALLOWLIST AND NOT `lucide[name]`
   ----------------------------------------------------------------
   Two reasons, and only one of them is safety. Reaching into the
   library by a database-supplied string would pull every icon it
   ships into the bundle (tree-shaking cannot follow a dynamic key),
   and it would let a typo — or a stale row — render whatever else
   happens to sit at that name. A fixed map imports exactly these
   marks and resolves everything else to the fallback.

   THE FALLBACK CHAIN, in order:
     1. `service.icon`, if it names a mark below.
     2. `DEFAULT_ICON_BY_KEY[service.key]` — the original pairing, so
        a row seeded before the column existed still draws its own
        mark rather than a generic one.
     3. `null`, which `IconCard` renders as no icon at all.
   ================================================================ */

import {
  Award,
  BookOpen,
  Building2,
  ClipboardCheck,
  Compass,
  GraduationCap,
  HandCoins,
  Handshake,
  Lightbulb,
  LifeBuoy,
  MessagesSquare,
  Network,
  Rocket,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

/** Icon name → component. The name is what the database stores. */
export const SERVICE_ICONS = {
  lightbulb: Lightbulb,
  'clipboard-check': ClipboardCheck,
  compass: Compass,
  'messages-square': MessagesSquare,
  'graduation-cap': GraduationCap,
  users: Users,
  'hand-coins': HandCoins,
  handshake: Handshake,
  network: Network,
  target: Target,
  rocket: Rocket,
  'trending-up': TrendingUp,
  award: Award,
  'book-open': BookOpen,
  'building-2': Building2,
  'life-buoy': LifeBuoy,
};

/**
 * The dashboard's icon picker, in the order it lists them.
 *
 * The label describes what the mark DEPICTS, not what it means —
 * an editor is choosing a drawing, and "مصباح" is checkable against
 * the preview beside it in a way that "الابتكار" is not.
 */
export const SERVICE_ICON_OPTIONS = [
  { value: 'lightbulb', label: 'مصباح' },
  { value: 'clipboard-check', label: 'قائمة مراجعة' },
  { value: 'compass', label: 'بوصلة' },
  { value: 'messages-square', label: 'محادثة' },
  { value: 'graduation-cap', label: 'قبعة تخرّج' },
  { value: 'users', label: 'مجموعة أشخاص' },
  { value: 'hand-coins', label: 'يد ونقود' },
  { value: 'handshake', label: 'مصافحة' },
  { value: 'network', label: 'شبكة' },
  { value: 'target', label: 'هدف' },
  { value: 'rocket', label: 'صاروخ' },
  { value: 'trending-up', label: 'منحنى صاعد' },
  { value: 'award', label: 'وسام' },
  { value: 'book-open', label: 'كتاب مفتوح' },
  { value: 'building-2', label: 'مبنى' },
  { value: 'life-buoy', label: 'طوق نجاة' },
];

/** The original pairing, kept as the fallback for a row with no icon. */
export const DEFAULT_ICON_BY_KEY = {
  'idea-development': 'lightbulb',
  'feasibility-review': 'clipboard-check',
  'management-guidance': 'compass',
  'specialist-consulting': 'messages-square',
  training: 'graduation-cap',
  'expert-network': 'users',
  'investor-network': 'hand-coins',
};

/** The mark for one service, or `null` when it resolves to nothing. */
export function serviceIcon(service) {
  const name = service?.icon || DEFAULT_ICON_BY_KEY[service?.key];
  return SERVICE_ICONS[name] ?? null;
}

export default SERVICE_ICONS;
