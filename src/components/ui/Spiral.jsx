import { cn } from '@utils/cn.js';

/**
 * The Bedar spiral — the circular mark from the logo, on its own.
 *
 * Per the design system this is the ownable motif: reuse it as a
 * section divider, a watermark on cards, and a bullet on program
 * tags. It inherits `currentColor`, so tint it with any text utility
 * (`text-brand-500`, `text-brand-200`, …).
 *
 * It is a decorative shape, so it is `aria-hidden` by default. Pass a
 * `title` when it is genuinely carrying meaning (e.g. used alone as a
 * logo) and it becomes an exposed `img` role instead.
 */
export function Spiral({ className, title, ...rest }) {
  const decorative = !title;

  return (
    <svg
      viewBox="0 0 66 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-6 w-auto', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={title}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M38.8553 103.922H26.8143C24.5633 103.922 22.7383 102.097 22.7383 99.8455C22.7383 97.5945 24.5633 95.7695 26.8143 95.7695H38.8553C41.1063 95.7695 42.9313 97.5945 42.9313 99.8455C42.9313 102.097 41.1073 103.922 38.8553 103.922Z"
        fill="currentColor"
      />
      <path
        d="M46.5534 29.1057C41.8904 26.9867 36.9575 26.0677 32.1165 26.2197C25.6595 29.1457 20.8124 39.2787 20.8124 39.2787C32.8474 32.3437 42.5985 37.8067 42.5985 37.8067C54.1715 43.0667 59.3085 56.7617 54.0475 68.3357C52.7785 71.1277 50.9545 73.6567 48.6985 75.7337C46.5085 77.7487 43.9274 79.3297 41.1404 80.3717C39.3774 81.0317 37.5374 81.5156 35.6614 81.6986C33.8994 81.8706 32.1314 81.6917 30.3944 81.3857C27.6714 80.9057 25.0254 79.9936 22.6064 78.6516C20.2974 77.3706 18.2074 75.7037 16.4504 73.7317C14.6934 71.7607 13.2774 69.4937 12.2564 67.0587C11.1924 64.5197 10.5634 61.8086 10.3544 59.0646C10.2564 57.7776 10.2515 56.4847 10.3315 55.1967C11.5685 35.3907 29.3204 19.5947 46.3644 12.7277C46.7094 12.5887 47.0275 12.4127 47.3235 12.2127C49.2235 11.4227 51.1285 10.7217 53.0165 10.1297C55.7485 9.27567 57.2694 6.36766 56.4154 3.63465C55.5594 0.903655 52.6484 -0.616333 49.9204 0.237667C43.6324 2.20567 37.5294 5.01766 31.9464 8.46066C25.2424 12.4217 19.1414 17.3157 14.2144 22.8117C5.67045 32.3417 0.783438 43.3187 0.0814384 54.5567C-0.884562 70.0117 6.80943 82.7446 19.6384 88.3196C19.7224 88.3576 19.8075 88.3896 19.8915 88.4266C19.9195 88.4386 19.9475 88.4506 19.9745 88.4616C23.4965 90.0156 27.2875 90.9527 31.1295 91.2057C34.6395 91.4367 38.1814 91.0687 41.5794 90.1657C44.4284 89.4087 47.1744 88.2657 49.7174 86.7737C52.2834 85.2677 54.6394 83.4067 56.6954 81.2557C58.8164 79.0367 60.6125 76.5116 62.0215 73.7846C62.2755 73.2926 62.5174 72.7936 62.7464 72.2896C70.1904 55.9196 62.9244 36.5467 46.5534 29.1057Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Section divider built from the spiral — a hairline rule broken by
 * the mark. Used between marketing sections instead of a plain <hr>.
 */
export function SpiralDivider({ className }) {
  return (
    <div
      className={cn('flex items-center gap-4 text-brand-200', className)}
      role="separator"
      aria-orientation="horizontal"
    >
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-current opacity-70" />
      <Spiral className="size-5 shrink-0 opacity-100" />
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-current opacity-70" />
    </div>
  );
}

/**
 * The boundary between two stacked sections, marked by a `SpiralDivider`
 * that sits EXACTLY on the seam and adds no vertical space of its own.
 *
 * The wrapper is `h-0`, so it contributes nothing to layout — it is a
 * zero-height marker dropped between two sections in normal flow. The
 * rule is then absolutely centred on that zero-height line
 * (`top-0 -translate-y-1/2`), straddling the join. This is the fix for
 * the "big white band with a lonely spiral" gap: the sections keep
 * their own padding and touch, and the divider is a deliberate line
 * connecting them rather than filler inside an empty strip.
 *
 * `tone` tints the rule for the surface it lands on. The site is
 * dark-only, so both tones are lightened teal — clearly visible on the
 * unified dark surface, which is exactly the fix the brief asked for
 * (the seam was too faint in dark).
 */
export function SectionSeam({ tone = 'light', className }) {
  return (
    <div aria-hidden="true" className={cn('relative z-10 h-0', className)}>
      <div className="container-page absolute inset-x-0 top-0 -translate-y-1/2">
        <SpiralDivider className={tone === 'dark' ? 'text-brand-200/60' : 'text-brand-200/85'} />
      </div>
    </div>
  );
}

export default Spiral;
