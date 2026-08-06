import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names, with later Tailwind utilities
 * beating earlier conflicting ones.
 *
 *   cn('px-4 py-2', isLarge && 'px-6')  →  'py-2 px-6'
 *
 * Without twMerge, `px-4 px-6` both land in the class list and the
 * winner is decided by stylesheet order, not call order — which is
 * the usual source of "my prop doesn't override the default" bugs.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
