import { Link } from 'react-router-dom';

import { Spiral } from '@components/ui/Spiral.jsx';
import { NewsletterForm } from './NewsletterForm.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   FOOTER — structure and copy match bedar.webflow.io exactly:

     brand blurb + contact rail | القائمة الرئيسية | أحدث المقالات
     | النشرة البريدية
     ────────────────────────────────────────────────────────────
     كافة الحقوق محفوظة © … {year}        تصميم وتطوير شركة Threems

   Every string comes from `content/site.js`; nothing here is
   hardcoded (Infra spec §3). One of the four surfaces allowed the
   dark `.surface-dark` treatment.
   ================================================================ */

/** Internal links get <Link>, external ones a real <a>. */
function FooterLink({ href, children, className }) {
  const external = /^(https?:|mailto:|tel:)/.test(href);
  const classes = cn(
    'text-sm text-brand-100/80 no-underline transition-colors duration-(--dur-fast) hover:text-brand-200 hover:underline',
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
  return <h2 className="text-sm font-semibold tracking-wide text-white">{children}</h2>;
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
    <footer className="surface-dark mt-auto">
      <div className="container-page py-12 sm:py-16 lg:py-20">
        {/* Two columns from the smallest screen up — a single-file
            stack of brand block, menu, articles and newsletter ran
            to several screens of scrolling on mobile. The brand
            block still takes the full row (it carries the most
            content); menu and articles pair up beside each other,
            and the newsletter closes the row full-width so its input
            has room to breathe. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 lg:grid-cols-12 lg:gap-8">
          {/* ── Brand + contact rail ─────────────────────────── */}
          <div className="col-span-2 lg:col-span-4">
            <div className="flex items-center gap-3">
              <Spiral className="size-9 text-brand-200" />
              <span className="text-2xl font-bold text-white">{settings.name}</span>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-100/70">
              <FooterLink href={footer.tagline.href}>{footer.tagline.label}</FooterLink>
            </p>

            {/* Contact rail. The live site puts a brand glyph beside
                each account; lucide dropped its brand set and the
                design system ships none, so these are text rows for
                now. Real marks slot in beside `account.label` with no
                other change (design-system readme, "Caveats").
                Two columns keeps five short entries from stretching
                into their own long single-file list on mobile. */}
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:flex sm:flex-col sm:gap-3">
              <li className="flex flex-col">
                <span className="text-xs text-brand-100/60">Email</span>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-sm text-brand-100/90 no-underline hover:text-brand-200 hover:underline"
                >
                  <span className="ltr-run">{settings.email}</span>
                </a>
              </li>

              {settings.social.map((account) => (
                <li key={account.id} className="flex flex-col">
                  <span className="text-xs text-brand-100/60">{account.label}</span>
                  <a
                    href={account.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-brand-100/90 no-underline hover:text-brand-200 hover:underline"
                  >
                    <span className="ltr-run">{account.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Link columns ─────────────────────────────────── */}
          {footer.columns.map((column) => (
            <nav key={column.id} aria-label={column.title} className="col-span-1 lg:col-span-3">
              <ColumnTitle>{column.title}</ColumnTitle>
              <ul className="mt-4 flex flex-col gap-3 sm:mt-5">
                {column.links.map((link) => (
                  <li key={link.id}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* ── Latest articles — driven by the `articles` collection,
                 so a newly published article lands here with no code
                 change. ────────────────────────────────────────── */}
          <nav aria-label={footer.latestArticles.title} className="col-span-1 lg:col-span-3">
            <ColumnTitle>{footer.latestArticles.title}</ColumnTitle>
            <ul className="mt-4 flex flex-col gap-3 sm:mt-5">
              {footer.latestArticles.items.map((article) => (
                <li key={article.id}>
                  <FooterLink href={article.href}>{article.title}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Newsletter ───────────────────────────────────── */}
          <div className="col-span-2 lg:col-span-2">
            <ColumnTitle>{footer.newsletter.title}</ColumnTitle>
            <NewsletterForm newsletter={footer.newsletter} className="mt-4 sm:mt-5" />
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────── */}
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-8">
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
              className="text-brand-200 no-underline hover:underline"
            >
              {footer.credit.label}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
