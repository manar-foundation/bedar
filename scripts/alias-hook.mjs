/* ================================================================
   Node resolve hook for the Vite import aliases.

   `src/content/*.js` is written for the browser bundle and imports
   `@utils/constants.js`. Node has no idea what `@utils` is, so a
   script that wants to read the seed content — and the point of the
   seed script is that content has ONE source — needs the same alias
   table Vite uses.

   Registered from `seed-supabase.mjs` via `module.register()`.
   Keep the list in step with `vite.config.js`.
   ================================================================ */

const ALIASES = {
  '@components/': '../src/components/',
  '@pages/': '../src/pages/',
  '@layouts/': '../src/layouts/',
  '@hooks/': '../src/hooks/',
  '@context/': '../src/context/',
  '@services/': '../src/services/',
  '@utils/': '../src/utils/',
  '@assets/': '../src/assets/',
  '@styles/': '../src/styles/',
  '@content/': '../src/content/',
  '@/': '../src/',
};

export function resolve(specifier, context, nextResolve) {
  for (const [prefix, target] of Object.entries(ALIASES)) {
    if (specifier.startsWith(prefix)) {
      const resolved = new URL(target + specifier.slice(prefix.length), import.meta.url).href;
      return nextResolve(resolved, context);
    }
  }
  return nextResolve(specifier, context);
}
