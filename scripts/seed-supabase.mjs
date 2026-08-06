#!/usr/bin/env node
/* ================================================================
   SEED SUPABASE — src/content/ → the Phase 4 schema

   Loads the local seed content into a freshly migrated project, so
   the dashboard opens onto the real site instead of onto empty
   tables.

   WHY A SCRIPT AND NOT A SQL SEED FILE
   ----------------------------------------------------------------
   The same reason `migrate-bodies.mjs` exists: hand-copying ~40 kB
   of Arabic editorial copy into INSERT statements is a silent
   corruption risk, and it would leave two sources for every string
   that then drift apart. `src/content/` stays the single source —
   this reads it and writes what it finds.

   Idempotent. Every write is an upsert keyed on the same stable ids
   the content files already use, so running it twice changes
   nothing and running it after a content edit brings the database
   back in line.

   REQUIRES THE SERVICE-ROLE KEY. RLS is on for every table and the
   seed writes rows nobody is signed in to own. The key is read from
   the environment and never from a VITE_ variable — anything with
   that prefix ends up in the browser bundle.

     SUPABASE_URL=…  SUPABASE_SERVICE_ROLE_KEY=…  node scripts/seed-supabase.mjs

   Usage:
     node scripts/seed-supabase.mjs            # write
     node scripts/seed-supabase.mjs --dry-run  # print the plan only
   ================================================================ */

import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';

// Must run before the content modules are imported — they use the
// Vite aliases, which Node cannot resolve on its own.
register('./alias-hook.mjs', import.meta.url);

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const DRY_RUN = process.argv.includes('--dry-run');

/* ── .env, without a dependency ─────────────────────────────── */
function loadEnvFile() {
  try {
    const raw = readFileSync(resolvePath(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // No .env is fine — CI passes the variables directly.
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* ── Content ────────────────────────────────────────────────── */
const { navigation, headerCta, footer, siteSettings } = await import('../src/content/site.js');
const pageContent = await import('../src/content/pages.js');
const { programs, articles, news } = await import('../src/content/collections.js');
const { bodies } = await import('../src/content/collection-bodies.js');

/**
 * Pages to create, in the order they appear in the dashboard.
 *
 * The 404 is deliberately absent: it is fixed content and is never
 * editable from the dashboard (Dashboard spec §14). A row for it
 * would be a row that lies about what the dashboard can do.
 */
const PAGES = [
  { key: 'home', slug: '', title: 'الرئيسية', content: pageContent.home, rendersFaq: true },
  { key: 'about', slug: 'about', title: 'من نحن', content: pageContent.about },
  {
    key: 'social-entrepreneurship',
    slug: 'social-entrepreneurship',
    title: 'بدار والريادة المجتمعية',
    content: pageContent.socialEntrepreneurship,
  },
  { key: 'services', slug: 'services', title: 'الخدمات', content: pageContent.servicesPage },
  { key: 'programs', slug: 'programs', title: 'البرامج', content: pageContent.programsPage },
  { key: 'blog', slug: 'blog', title: 'المدونة', content: pageContent.blogPage },
  { key: 'news', slug: 'news', title: 'الأخبار', content: pageContent.newsPage },
  { key: 'contact-us', slug: 'contact-us', title: 'تواصل معنا', content: pageContent.contact },
];

/* ── Page content → page_fields rows ────────────────────────────
   The page objects are nested ('hero.title'), the table is flat, so
   the nesting becomes a dotted key. Field TYPE is inferred from the
   value's shape rather than declared twice: a {label, href} pair is
   a CTA — Dashboard spec §2 wants the button text and the button
   link as separate editable fields, and that is exactly what this
   shape already is. ───────────────────────────────────────────── */
function toFields(node, prefix = '', out = []) {
  for (const [key, value] of Object.entries(node)) {
    // SEO lives in columns on `pages`, not in a content field.
    if (!prefix && key === 'seo') continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      out.push({ key: path, type: 'text', value });
    } else if (typeof value === 'number') {
      out.push({ key: path, type: 'number', value });
    } else if (typeof value === 'boolean') {
      out.push({ key: path, type: 'boolean', value });
    } else if (Array.isArray(value)) {
      out.push({ key: path, type: 'list', value });
    } else if (value && typeof value === 'object') {
      if ('label' in value && 'href' in value && Object.keys(value).length <= 3) {
        out.push({ key: path, type: 'cta', value });
      } else {
        toFields(value, path, out);
      }
    }
  }
  return out;
}

/* ── Collections ────────────────────────────────────────────── */
function collectionRows(collection, items) {
  return items.map((item) => ({
    collection,
    slug: item.slug,
    // The migrated site mixes /programs/:slug and /program/:slug.
    // Both are routed; rewriting them would 404 inbound links the
    // client does not control.
    path: item.href,
    title: item.title,
    excerpt: item.excerpt ?? '',
    body: bodies[item.slug] ?? [],
    category: item.category ?? '',
    program_status: collection === 'programs' ? (item.status ?? null) : null,
    state: item.state ?? 'published',
    published_at: item.date ? new Date(item.date).toISOString() : null,
    seo_title: item.seo?.title ?? '',
    seo_description: item.seo?.description ?? '',
  }));
}

/* ── Navigation ─────────────────────────────────────────────── */
function navigationPlan() {
  const parents = [];
  const children = [];

  navigation.forEach((item, index) => {
    parents.push({
      location: 'header',
      key: item.id,
      label: item.label,
      // NULL href marks a group — "منصة بدار" is a dropdown toggle
      // with no link of its own on the live site.
      href: item.href ?? null,
      position: index,
    });

    (item.children ?? []).forEach((child, childIndex) => {
      children.push({
        location: 'header',
        parentKey: item.id,
        key: child.id,
        label: child.label,
        href: child.href,
        position: childIndex,
      });
    });
  });

  footer.columns.forEach((column, index) => {
    parents.push({
      location: 'footer',
      key: column.id,
      label: column.title,
      href: null,
      position: index,
    });

    column.links.forEach((link, linkIndex) => {
      children.push({
        location: 'footer',
        parentKey: column.id,
        key: link.id,
        label: link.label,
        href: link.href,
        position: linkIndex,
      });
    });
  });

  return { parents, children };
}

/* ── Settings ───────────────────────────────────────────────── */
const SETTINGS = {
  organization: {
    name: siteSettings.name,
    legalName: siteSettings.legalName,
    url: siteSettings.url,
    logo: siteSettings.logo,
    email: siteSettings.email,
  },
  social: siteSettings.social,
  header_cta: headerCta,
  footer: {
    tagline: footer.tagline,
    latestArticles: { title: footer.latestArticles.title, limit: footer.latestArticles.limit },
    newsletter: footer.newsletter,
    legal: footer.legal,
    credit: footer.credit,
  },
  integrations: siteSettings.integrations,
  captcha: siteSettings.captcha,
  consent: siteSettings.consent,
  forms: { contact: pageContent.contact.form },
};

/* ── Run ────────────────────────────────────────────────────── */
const nav = navigationPlan();
const collections = [
  ...collectionRows('programs', programs),
  ...collectionRows('articles', articles),
  ...collectionRows('news', news),
];
const testimonialRows = pageContent.testimonials.map((item, index) => ({
  quote: item.quote,
  person_name: item.author,
  person_title: item.role ?? '',
  position: index,
  state: 'published',
}));
const faqRows = pageContent.faq.map((item, index) => ({
  question: item.question,
  answer: item.answer,
  position: index,
  state: 'published',
}));

const plan = [
  ['site_settings', Object.keys(SETTINGS).length],
  ['navigation_items', nav.parents.length + nav.children.length],
  ['pages', PAGES.length],
  ['page_fields', PAGES.reduce((total, page) => total + toFields(page.content).length, 0)],
  ['collection_items', collections.length],
  ['testimonials', testimonialRows.length],
  ['faq_items', faqRows.length],
];

console.log('\nbedar · seed plan');
for (const [table, count] of plan) {
  console.log(`  ${table.padEnd(18)} ${count}`);
}

if (DRY_RUN) {
  console.log('\n--dry-run — nothing written.\n');
  process.exit(0);
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '\nناقص: SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY.\n' +
      'The service-role key bypasses RLS and must never be a VITE_ variable.\n' +
      'Find it in the Supabase dashboard → Project Settings → API.\n',
  );
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function check(label, { error }) {
  if (error) {
    console.error(`✗ ${label}: ${error.message}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

/* Settings — the rows exist from migration 0007 with their
   is_public / min_role metadata. Only the value is written here, so
   a re-run never resets who is allowed to edit what. */
for (const [key, value] of Object.entries(SETTINGS)) {
  check(`site_settings.${key}`, await db.from('site_settings').update({ value }).eq('key', key));
}

/* Navigation — parents first, then children, because the child rows
   need the generated parent ids. */
check(
  'navigation_items (groups)',
  await db.from('navigation_items').upsert(nav.parents, { onConflict: 'location,key' }),
);

const { data: parentRows, error: parentError } = await db
  .from('navigation_items')
  .select('id, location, key');

if (parentError) {
  console.error(`✗ navigation lookup: ${parentError.message}`);
  process.exit(1);
}

const parentId = new Map(parentRows.map((row) => [`${row.location}:${row.key}`, row.id]));

check(
  'navigation_items (links)',
  await db.from('navigation_items').upsert(
    nav.children.map(({ parentKey, ...row }) => ({
      ...row,
      parent_id: parentId.get(`${row.location}:${parentKey}`) ?? null,
    })),
    { onConflict: 'location,key' },
  ),
);

/* Pages, then their fields. */
check(
  'pages',
  await db.from('pages').upsert(
    PAGES.map((page, index) => ({
      key: page.key,
      slug: page.slug,
      title: page.title,
      position: index,
      seo_title: page.content.seo?.title ?? '',
      seo_description: page.content.seo?.description ?? '',
      renders_faq: Boolean(page.rendersFaq),
      state: 'published',
    })),
    { onConflict: 'key' },
  ),
);

const { data: pageRows, error: pageError } = await db.from('pages').select('id, key');
if (pageError) {
  console.error(`✗ pages lookup: ${pageError.message}`);
  process.exit(1);
}

const pageId = new Map(pageRows.map((row) => [row.key, row.id]));

const fieldRows = PAGES.flatMap((page) =>
  toFields(page.content).map((field, index) => ({
    page_id: pageId.get(page.key),
    key: field.key,
    type: field.type,
    value: field.value,
    position: index,
  })),
).filter((row) => row.page_id);

check(
  'page_fields',
  await db.from('page_fields').upsert(fieldRows, { onConflict: 'page_id,key' }),
);

check(
  'collection_items',
  await db.from('collection_items').upsert(collections, { onConflict: 'collection,slug' }),
);

/* Testimonials and FAQ have no natural key in the content files —
   their ids are slugs of the author/question, not columns here — so
   a re-run replaces them wholesale rather than accumulating
   duplicates. Both are small, editorial, and not referenced by
   anything else. */
check('testimonials (clear)', await db.from('testimonials').delete().gte('position', 0));
check('testimonials', await db.from('testimonials').insert(testimonialRows));

check('faq_items (clear)', await db.from('faq_items').delete().gte('position', 0));
check('faq_items', await db.from('faq_items').insert(faqRows));

console.log(
  process.exitCode === 1
    ? '\nانتهى مع أخطاء — راجع الرسائل أعلاه.\n'
    : '\nتم زرع المحتوى بنجاح.\n',
);
