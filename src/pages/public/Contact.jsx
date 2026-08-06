import { Mail, Phone } from 'lucide-react';

import { Card, Hero, SectionHeading } from '@components/ui';
import { ContactForm } from '@components/layout/ContactForm.jsx';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { contact } from '@content/pages.js';

/** تواصل معنا — the contact form plus the direct channels. */
export default function Contact() {
  const { settings } = useContent();
  useSeo(contact.seo);

  return (
    <>
      <Hero title={contact.hero.title} subtitle={contact.hero.subtitle} showSpiral={false} />

      <section className="container-page section-y">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* ── Channels ────────────────────────────────────── */}
          <div>
            <SectionHeading title={contact.intro.title} align="start" />

            <Reveal as="p" delay={1} className="mt-4 leading-relaxed text-ink-secondary">
              {contact.intro.body}
            </Reveal>

            <Reveal as="p" delay={2} className="mt-8 text-sm font-semibold text-ink">
              {contact.intro.channelsLabel}
            </Reveal>

            <div className="mt-5 flex flex-col gap-4">
              <Reveal delay={3}>
                <Card elevation={0} className="flex-row items-center gap-4 p-5">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                    <Mail className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-ink-muted">{contact.channels.emailLabel}</span>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-sm font-medium text-ink no-underline hover:text-brand-600"
                    >
                      <span className="ltr-run">{settings.email}</span>
                    </a>
                  </span>
                </Card>
              </Reveal>

              <Reveal delay={4}>
                <Card elevation={0} className="flex-row items-center gap-4 p-5">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                    <Phone className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-ink-muted">{contact.channels.phoneLabel}</span>
                    {/* tel: needs the number unspaced; the visible
                        text keeps the readable grouping. */}
                    <a
                      href={`tel:${contact.channels.phone.replace(/\s/g, '')}`}
                      className="text-sm font-medium text-ink no-underline hover:text-brand-600"
                    >
                      <span className="ltr-run">{contact.channels.phone}</span>
                    </a>
                  </span>
                </Card>
              </Reveal>
            </div>

            <Reveal delay={5} className="mt-8">
              <p className="text-sm font-semibold text-ink">{contact.channels.socialLabel}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {settings.social.map((account) => (
                  <li key={account.id}>
                    <a
                      href={account.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex rounded-full border border-default px-4 py-2 text-sm text-ink-secondary no-underline transition-colors duration-(--dur-fast) hover:border-brand-300 hover:text-brand-600"
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
            <Card elevation={1} className="p-7 lg:p-9">
              <ContactForm form={contact.form} />
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  );
}
