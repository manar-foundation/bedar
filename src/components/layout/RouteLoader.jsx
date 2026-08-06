import { Spiral } from '@components/ui/Spiral.jsx';

/**
 * Suspense fallback for lazily-loaded routes.
 *
 * Uses the logo spiral rather than a generic ring — it is the
 * ownable Bedar motif, so even the loading state stays on-brand.
 */
export default function RouteLoader({ label = 'جارٍ التحميل' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
    >
      <Spiral
        className="size-10 animate-[spiral-spin_1.6s_linear_infinite] text-brand-500 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}
