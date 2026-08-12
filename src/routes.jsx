import { lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

import PublicLayout from '@layouts/PublicLayout.jsx';
import ScrollToTop from '@components/layout/ScrollToTop.jsx';

/* Canonical redirect for the legacy singular path. A client-side
   `replace` navigation keeps the old link working while landing the
   visitor on /programs/:slug; the Netlify layer issues the real 301
   for crawlers (Phase 6). */
function ProgramRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/programs/${slug}`} replace />;
}

/* ── Public pages — eager for the home route, lazy for the rest.
      Home is the overwhelming majority of traffic; making it lazy
      only adds a round trip before first paint. ─────────────────── */
import Home from '@pages/public/Home.jsx';

const About = lazy(() => import('@pages/public/About.jsx'));
const SocialEntrepreneurship = lazy(() => import('@pages/public/SocialEntrepreneurship.jsx'));
const Programs = lazy(() => import('@pages/public/Programs.jsx'));
const ProgramDetail = lazy(() => import('@pages/public/ProgramDetail.jsx'));
/* One program has a page rather than an article body — see the note
   on its route below, and the header of pages/public/Hackathon.jsx. */
const Hackathon = lazy(() => import('@pages/public/Hackathon.jsx'));
const Services = lazy(() => import('@pages/public/Services.jsx'));
const Blog = lazy(() => import('@pages/public/Blog.jsx'));
const ArticleDetail = lazy(() => import('@pages/public/ArticleDetail.jsx'));
const News = lazy(() => import('@pages/public/News.jsx'));
const NewsDetail = lazy(() => import('@pages/public/NewsDetail.jsx'));
const Contact = lazy(() => import('@pages/public/Contact.jsx'));
const NotFound = lazy(() => import('@pages/public/NotFound.jsx'));

/* ── Admin — always lazy, including the provider shell. Public
      visitors must never download the dashboard bundle, and
      AdminShell is what keeps `@supabase/supabase-js` out of the
      public critical path. ──────────────────────────────────────── */
const AdminShell = lazy(() => import('@layouts/AdminShell.jsx'));
const ProtectedAdminLayout = lazy(() => import('@layouts/ProtectedAdminLayout.jsx'));
const Login = lazy(() => import('@pages/admin/Login.jsx'));
const Dashboard = lazy(() => import('@pages/admin/Dashboard.jsx'));
const PagesList = lazy(() => import('@pages/admin/PagesList.jsx'));
const PageEditor = lazy(() => import('@pages/admin/PageEditor.jsx'));
const GlobalContent = lazy(() => import('@pages/admin/GlobalContent.jsx'));
const CollectionsList = lazy(() => import('@pages/admin/CollectionsList.jsx'));
const CollectionEditor = lazy(() => import('@pages/admin/CollectionEditor.jsx'));
const MediaLibrary = lazy(() => import('@pages/admin/MediaLibrary.jsx'));
const Redirects = lazy(() => import('@pages/admin/Redirects.jsx'));
const Integrations = lazy(() => import('@pages/admin/Integrations.jsx'));
const Users = lazy(() => import('@pages/admin/Users.jsx'));
const Security = lazy(() => import('@pages/admin/Security.jsx'));
const Settings = lazy(() => import('@pages/admin/Settings.jsx'));
const VersionHistory = lazy(() => import('@pages/admin/VersionHistory.jsx'));

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Public site ─────────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="social-entrepreneurship" element={<SocialEntrepreneurship />} />
          <Route path="programs" element={<Programs />} />
          {/* BEFORE the `:slug` route, so the static segment wins.
              React Router 7 ranks a static segment above a dynamic one
              regardless of declaration order, so this is belt and
              braces — but the order is also what a reader expects, and
              it keeps the exception visible next to the rule.

              The hackathon is the one program whose source was a built
              landing page rather than an article, so its content is
              structured (`content/hackathon.js`) and it has its own
              layout. Every other program still renders through
              `ProgramDetail` → `CollectionDetail`, and the hackathon
              still appears in the /programs listing like any other —
              only the detail view differs. */}
          <Route path="programs/hackathon" element={<Hackathon />} />
          <Route path="programs/:slug" element={<ProgramDetail />} />
          {/* The live site linked some detail pages under the singular
              /program/:slug. The path is now unified on the plural
              /programs/:slug, so the singular 301-redirects to it —
              old inbound links resolve to the canonical URL rather than
              silently rendering a second path for the same page. */}
          <Route path="program/:slug" element={<ProgramRedirect />} />
          <Route path="services" element={<Services />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<ArticleDetail />} />
          <Route path="news" element={<News />} />
          <Route path="news/:slug" element={<NewsDetail />} />
          <Route path="contact-us" element={<Contact />} />
          {/* 404 — fixed content, never editable from the dashboard
              (Dashboard spec §14, out of scope for v1) */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ── Admin ───────────────────────────────────────────── */}
        <Route element={<AdminShell />}>
          <Route path="admin/login" element={<Login />} />
          <Route path="admin" element={<ProtectedAdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pages" element={<PagesList />} />
            <Route path="pages/:id" element={<PageEditor />} />
            <Route path="global" element={<GlobalContent />} />
            <Route
              path="collections"
              element={<Navigate to="/admin/collections/articles" replace />}
            />
            <Route path="collections/:collection" element={<CollectionsList />} />
            <Route path="collections/:collection/:id" element={<CollectionEditor />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="redirects" element={<Redirects />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="users" element={<Users />} />
            {/* Reachable before 2FA enrolment — and the only one.
                `RequireAuth` sends a user with no factor here and
                refuses every other admin route (spec §13). */}
            <Route path="security" element={<Security />} />
            <Route path="settings" element={<Settings />} />
            <Route path="history" element={<VersionHistory />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
