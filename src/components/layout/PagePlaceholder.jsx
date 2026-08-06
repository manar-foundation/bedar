import { Spiral } from '@components/ui/Spiral.jsx';

/**
 * Honest scaffold marker.
 *
 * Every route exists from Phase 1 so navigation, layouts and the
 * 404 boundary can be tested for real. Screens that have not been
 * built yet render this instead of pretending to be finished — it
 * names the page and the phase that fills it in.
 *
 * Delete the import along with the placeholder when a page lands.
 */
export default function PagePlaceholder({ title, phase, description }) {
  return (
    <section className="container-page section-y">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <Spiral className="size-10 text-brand-300" />
        <h1 className="text-3xl font-bold text-ink md:text-4xl">{title}</h1>
        {description ? (
          <p className="text-base leading-relaxed text-ink-secondary">{description}</p>
        ) : null}
        <p className="rounded-full border border-dashed border-default px-4 py-2 text-sm text-ink-muted">
          هذه الصفحة قيد الإنشاء — {phase}
        </p>
      </div>
    </section>
  );
}
