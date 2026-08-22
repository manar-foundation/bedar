import { Mail, Phone } from 'lucide-react';

import { PageHero, Section, SectionHeading } from '@components/ui';
import { ContactForm } from '@components/layout/ContactForm.jsx';
import { submitContactForm } from '@services/publicForms.js';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useContent, usePage } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { pageBanners } from '@content/page-banners.js';
import { breadcrumbsFor } from '@content/site.js';

/**
 * تواصل معنا — the contact form plus the direct channels.
 *
 * LAYOUT
 * ----------------------------------------------------------------
 * On Consult's contact section, adapted: an information column
 * separated by hairline dividers on one side, the form held in a
 * panel on the other. The channels used to be two bordered cards
 * stacked in a column, which put three competing card edges (channel,
 * channel, form) in one band. Dividers give the column its structure
 * without adding another box, so the form panel is the only framed
 * element in the section — and therefore reads as the thing to do.
 */
export default function Contact() {
  const contact = usePage('contact');
  const { settings } = useContent();
  useSeo(contact.seo);

  return (
    <>
      {/* `/contact-us` is the header CTA rather than a nav link, so
          the trail's label is passed as the fallback — see
          `breadcrumbsFor` in content/site.js. */}
      <PageHero
        breadcrumbs={breadcrumbsFor('/contact-us', contact.hero.eyebrow)}
        eyebrow={contact.hero.eyebrow}
        title={contact.hero.title}
        subtitle={contact.hero.subtitle}
        image={pageBanners.contact}
      />

      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* ── Channels ────────────────────────────────────── */}
          {/* `.sticky-col` carries its own `lg` media query — it is a
              no-op below that, where the two halves stack. */}
          <div className="sticky-col">
            <SectionHeading title={contact.intro.title} layout="aside" lede={contact.intro.body} />

            <Reveal className="rule-fade my-9 block w-full" />

            <Reveal as="p" delay={1} className="text-sm font-semibold text-ink">
              {contact.intro.channelsLabel}
            </Reveal>

            {/* Each channel is a row with an icon, not a card. The
                form panel opposite is the only framed surface here. */}
            <ul className="mt-6 flex flex-col gap-6">
              {[
                {
                  id: 'email',
                  icon: Mail,
                  label: contact.channels.emailLabel,
                  value: settings.email,
                  href: `mailto:${settings.email}`,
                },
                {
                  id: 'phone',
                  icon: Phone,
                  label: contact.channels.phoneLabel,
                  value: contact.channels.phone,
                  // tel: needs the number unspaced; the visible text
                  // keeps the readable grouping.
                  href: `tel:${contact.channels.phone.replace(/\s/g, '')}`,
                },
              ].map((channel, index) => (
                <Reveal
                  as="li"
                  key={channel.id}
                  delay={index + 2}
                  className="flex items-center gap-4"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring">
                    <channel.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs text-ink-muted">{channel.label}</span>
                    <a
                      href={channel.href}
                      className="text-base font-medium text-ink no-underline transition-colors duration-(--dur-fast) hover:text-brand-200"
                    >
                      <span className="ltr-run">{channel.value}</span>
                    </a>
                  </span>
                </Reveal>
              ))}
            </ul>

            <Reveal className="rule-fade my-9 block w-full" />

            <Reveal delay={4}>
              <p className="text-sm font-semibold text-ink">{contact.channels.socialLabel}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {settings.social.map((account) => (
                  <li key={account.id}>
                    <a
                      href={account.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex rounded-full border border-default px-4 py-2 text-sm text-ink-secondary no-underline transition-colors duration-(--dur-fast) hover:border-brand-300 hover:text-brand-200"
                    >
                      {account.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* ── Form ────────────────────────────────────────── */}
          <Reveal>
            <div className="panel-quiet p-7 sm:p-9 lg:p-10">
              <ContactForm form={contact.form} onSubmit={submitContactForm} />
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
