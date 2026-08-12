import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

import Logo from '@components/ui/Logo.jsx';
import { Button } from '@components/ui/Button.jsx';
import { SocialIcon } from '@components/ui/SocialIcon.jsx';
import { NewsletterForm } from './NewsletterForm.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { headerCta } from '@content/site.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   FOOTER — a full-bleed closing band.

   IT USED TO BE A PANEL
   ----------------------------------------------------------------
   The reference layout builds its footer as a rounded dark card
   inside the page container, with the page showing around all four
   of its edges. That was ported here on the argument that a
   continuously dark page needs a panel edge to say "the page ends".

   The client asked for the footer to run the full width of the
   screen (edits doc, Aug 2026), so the boundary is now drawn as a
   floor rather than as a card: `.footer-band` (layout.css) puts a
   hairline across the whole viewport and steps the surface down into
   a darker base beneath it. The CONTENT still sits in
   `.container-page`, so no line of text runs to the bezel — "full
   width" is the band, not the measure.

   Regions, unchanged:

     brand + blurb + social marks   |   link columns
     ────────────────────────────────────────────────
     © … {year}   ·   design credit          [ CTA ]

   Every string still comes from `content/site.js`; nothing here is
   hardcoded (Infra spec §3). The CTA reuses `headerCta`, the same
   object the navbar renders, so the site's one call to action reads
   identically at the top and the bottom of every page and an edit in
   the dashboard changes both.

   THE COLUMN COUNT IS DATA
   ----------------------------------------------------------------
   `footer.columns` is dashboard-editable and can grow. A fixed
   4+3+3+2 split silently wraps the moment a second nav column is
   added, because the spans stop summing to twelve. The link region
   is therefore an `auto-fit` grid: it divides whatever is there,
   evenly, and gives the newsletter input a real measure instead of
   the 170px a fixed split left it.
   ================================================================ */

/** Internal links get <Link>, external ones a real <a>. */
function FooterLink({ href, children, className }) {
  const external = /^(https?:|mailto:|tel:)/.test(href);
  const classes = cn(
    // `inline-flex` + `min-h-6` gives every footer link a 24px box.
    // As plain inline text at `text-sm` they measured 18px tall, which
    // is under WCAG 2.5.8's 24×24 floor — on a phone the columns are
    // a stack of near-adjacent 18px targets and mis-taps are the
    // norm. The list's own `gap-3.5` supplies the spacing around them,
    // so the taller box costs no extra vertical rhythm.
    // `link-slide` is the reference's footer/dropdown link hover —
    // the link travels along the reading axis. Rule in layout.css,
    // scoped to `.public-site`.
    'link-slide inline-flex min-h-6 items-center text-sm text-brand-100/75 no-underline hover:text-brand-200',
    className,
  );

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={classes}>
      {children}
    </Link>
  );
}

/** Footer column heading — one type ramp for all four regions. */
function ColumnTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-200">{children}</h2>
  );
}

export default function Footer() {
  const { footer, settings } = useContent();
  const year = new Date().getFullYear();

  // `legal` is stored with a {year} placeholder so the dashboard can
  // reword the sentence without the year turning into a literal.
  // Split rather than string-replaced, so the number can be wrapped
  // in `.ltr-run` and never bidi-reorders against the Arabic around it.
  const [legalBefore, legalAfter = ''] = footer.legal.split('{year}');

  return (
    <footer className="footer-band mt-auto">
      <div className="container-page pb-10 pt-16 sm:pb-12 lg:pt-20">
        <div className="grid gap-x-8 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:items-start lg:gap-16">
          {/* ── Brand block ──────────────────────────────────── */}
          <div className="flex flex-col items-start">
            {/* Official white wordmark — the same asset the navbar
                  uses, so the footer and header read as one brand. */}
            <Logo white className="h-10 md:h-11" />

            <p className="mt-6 max-w-sm text-base leading-relaxed text-brand-100/80">
              <FooterLink href={footer.tagline.href} className="text-base">
                {footer.tagline.label}
              </FooterLink>
            </p>

            {/* The address stays as readable text — it is a contact
                  detail people copy, not a handle, and burying it in an
                  icon would cost more than it saves. */}
            <a
              href={`mailto:${settings.email}`}
              className="group/mail mt-6 inline-flex min-h-6 items-center gap-2.5 text-sm text-brand-100/80 no-underline transition-colors duration-(--dur-fast) hover:text-brand-200"
            >
              <Mail aria-hidden="true" className="size-4 shrink-0 text-brand-200" />
              <span className="ltr-run">{settings.email}</span>
            </a>

            {/* ── Social accounts ────────────────────────────────
                     One row per account: the platform's REAL mark in a
                     round chip (`SocialIcon`), then the platform name
                     and the handle as visible text.

                     The chip replaced a stand-in that carried the
                     platform's first LETTER — "F", "I", "L", "X" —
                     because lucide dropped its brand set and the design
                     system ships none. That stand-in is what the brief
                     asked to replace with the official logos.

                     THE HANDLES STAY VISIBLE (client, Aug 2026)
                     ------------------------------------------------
                     An icon-only row is the tidier shape and it is what
                     the reference layout does, but this site PUBLISHES
                     its handles as content — `@bedar.org`,
                     `@bedarplatform` — and moving them into a tooltip
                     and an aria-label takes them off the screen for
                     everyone who does not hover. They are content, so
                     they are rendered.

                     No `aria-label` here, deliberately: the visible
                     text is the link's accessible name. An aria-label
                     would REPLACE that name, so a voice-control user
                     saying "click Instagram" could stop matching what
                     they can see. The new-tab warning is an `sr-only`
                     span instead, which appends to the name rather
                     than overriding it. */}
            <ul className="mt-7 flex flex-col gap-3">
              {settings.social.map((account) => (
                <li key={account.id}>
                  <a
                    href={account.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="social-row flex items-center gap-3 no-underline"
                  >
                    <span className="social-chip">
                      <SocialIcon id={account.id} className="size-[1.15rem]" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs text-brand-100/55">{account.label}</span>
                      <span className="social-handle text-sm text-brand-100/85">
                        <span className="ltr-run">{account.handle}</span>
                      </span>
                    </span>
                    <span className="sr-only">(يفتح في تبويب جديد)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Link columns + newsletter ────────────────────── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {footer.columns.map((column) => (
              <nav key={column.id} aria-label={column.title}>
                <ColumnTitle>{column.title}</ColumnTitle>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {column.links.map((link) => (
                    <li key={link.id}>
                      <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {/* ── Latest articles — driven by the `articles`
                     collection, so a newly published article lands here
                     with no code change. ─────────────────────────── */}
            <nav aria-label={footer.latestArticles.title}>
              <ColumnTitle>{footer.latestArticles.title}</ColumnTitle>
              <ul className="mt-5 flex flex-col gap-3.5">
                {footer.latestArticles.items.map((article) => (
                  <li key={article.id}>
                    <FooterLink href={article.href}>{article.title}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ── Newsletter ─────────────────────────────────── */}
            <div className="col-span-2 lg:col-span-1">
              <ColumnTitle>{footer.newsletter.title}</ColumnTitle>
              <NewsletterForm newsletter={footer.newsletter} className="mt-5" />
            </div>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8 lg:mt-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-xs text-brand-100/60">
              {legalBefore}
              <span className="ltr-run">{year}</span>
              {legalAfter}
            </p>
            <p className="text-xs text-brand-100/60">
              {footer.credit.prefix}{' '}
              <a
                href={footer.credit.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-6 items-center text-brand-200 no-underline hover:underline"
              >
                {footer.credit.label}
              </a>
            </p>
          </div>

          {/* The same CTA object the navbar renders. ArrowLeft
                unmirrored — in RTL "forward" is leftward. */}
          <Button
            variant="inverse"
            to={headerCta.href}
            className="group self-start lg:self-auto"
            iconEnd={
              <ArrowLeft
                aria-hidden="true"
                className="size-4 transition-transform duration-(--dur-base) ease-(--ease-standard) group-hover:-translate-x-0.5"
              />
            }
          >
            {headerCta.label}
          </Button>
        </div>
      </div>
    </footer>
  );
}
