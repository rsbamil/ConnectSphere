import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MainLayout   from './components/layout/MainLayout'
import GuestLayout  from './components/layout/GuestLayout'
import AdminLayout  from './components/layout/AdminLayout'

// Pages
import HomePage        from './pages/HomePage'
import ExplorePage     from './pages/ExplorePage'
import ProfilePage     from './pages/ProfilePage'
import PostDetailPage  from './pages/PostDetailPage'
import HashtagPage     from './pages/HashtagPage'
import SearchPage      from './pages/SearchPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage    from './pages/SettingsPage'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import LandingPage     from './pages/LandingPage'

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminUsers      from './pages/admin/AdminUsers'
import AdminPosts      from './pages/admin/AdminPosts'
import AdminBroadcast  from './pages/admin/AdminBroadcast'

// ── Route guards ──────────────────────────────────────────────────────────────

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (user) return <Navigate to="/" replace />
  return children
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-cs-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-cs-border border-t-cs-accent animate-spin" />
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public / Guest routes ── */}
        <Route element={<GuestLayout />}>
          <Route path="/welcome" element={<LandingPage />} />
        </Route>

        <Route path="/login"    element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />

        {/* ── Authenticated user routes ── */}
        <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route path="/"             element={<HomePage />} />
          <Route path="/explore"      element={<ExplorePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/search"       element={<SearchPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/post/:postId"  element={<PostDetailPage />} />
          <Route path="/hashtag/:tag"  element={<HashtagPage />} />
        </Route>

        {/* ── Admin routes ── */}
        <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route path="/admin"           element={<AdminDashboard />} />
          <Route path="/admin/users"     element={<AdminUsers />} />
          <Route path="/admin/posts"     element={<AdminPosts />} />
          <Route path="/admin/broadcast" element={<AdminBroadcast />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
