import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { notifApi } from '../../services/api'
import Avatar from '../ui/Avatar'
import SuggestedUsersWidget from '../ui/SuggestedUsers'
import TrendingWidget from '../ui/TrendingHashtags'

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const HomeIcon   = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const CompassIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.75}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
const BellIcon   = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
const SearchIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
const ShieldIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
const MenuIcon   = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>

const NAV = [
  { to: '/',              icon: HomeIcon,       label: 'Home' },
  { to: '/explore',       icon: CompassIcon,    label: 'Explore' },
  { to: '/notifications', icon: BellIcon,       label: 'Notifications', badge: true },
  { to: '/search',        icon: SearchIcon,     label: 'Search' },
]

export default function MainLayout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    notifApi.unreadCount(user.userId)
      .then(r => setUnread(r.data.count))
      .catch(() => {})
    const interval = setInterval(() => {
      notifApi.unreadCount(user.userId)
        .then(r => setUnread(r.data.count))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <div className="min-h-screen bg-cs-bg flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-cs-surface border-r border-cs-border z-20">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-cs-border">
          <span className="font-display text-xl font-bold text-cs-accent tracking-tight">ConnectSphere</span>
          <p className="text-xs text-cs-subtle mt-0.5">Share. Connect. Discover.</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                 ${isActive ? 'bg-cs-accent/10 text-cs-accent' : 'text-cs-subtle hover:text-cs-text hover:bg-cs-muted'}`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              {badge && unread > 0 && (
                <span className="ml-auto bg-cs-accent text-cs-bg text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                 ${isActive ? 'bg-cs-purple/10 text-cs-purple' : 'text-cs-subtle hover:text-cs-text hover:bg-cs-muted'}`
              }
            >
              <ShieldIcon className="w-5 h-5" />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-cs-border">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-cs-muted cursor-pointer transition-colors"
            onClick={() => navigate(`/profile/${user?.userName}`)}>
            <Avatar src={user?.avatarUrl} name={user?.fullName} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-cs-text truncate">{user?.fullName}</p>
              <p className="text-xs text-cs-subtle truncate">@{user?.userName}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            className="mt-2 w-full text-left px-3 py-2 rounded-xl text-xs text-cs-subtle hover:text-cs-red hover:bg-cs-red/10 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-cs-surface border-b border-cs-border flex items-center justify-between px-4 h-14">
        <span className="font-display font-bold text-cs-accent">CS</span>
        <button onClick={() => setMobileOpen(o => !o)} className="text-cs-subtle hover:text-cs-text p-1">
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>

      {/* ── Mobile nav drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-64 bg-cs-surface border-r border-cs-border p-4 animate-slide-in"
            onClick={e => e.stopPropagation()}>
            <div className="mb-4 px-2">
              <span className="font-display text-xl font-bold text-cs-accent">ConnectSphere</span>
            </div>
            {NAV.map(({ to, icon: Icon, label, badge }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-all
                   ${isActive ? 'bg-cs-accent/10 text-cs-accent' : 'text-cs-subtle hover:text-cs-text hover:bg-cs-muted'}`
                }>
                <Icon className="w-5 h-5" />
                {label}
                {badge && unread > 0 && <span className="ml-auto badge-amber">{unread}</span>}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-cs-subtle hover:text-cs-text hover:bg-cs-muted">
                <ShieldIcon className="w-5 h-5" /> Admin Panel
              </NavLink>
            )}
            <div className="mt-4 pt-4 border-t border-cs-border">
              <div className="flex items-center gap-3 px-2 py-2 cursor-pointer" onClick={() => { navigate(`/profile/${user?.userName}`); setMobileOpen(false) }}>
                <Avatar src={user?.avatarUrl} name={user?.fullName} size={32} />
                <div>
                  <p className="text-sm font-semibold">{user?.fullName}</p>
                  <p className="text-xs text-cs-subtle">@{user?.userName}</p>
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/login') }}
                className="mt-2 w-full text-left px-3 py-2 rounded-xl text-xs text-cs-red hover:bg-cs-red/10 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content + right sidebar ── */}
      <div className="flex-1 lg:ml-64 mt-14 lg:mt-0">
        <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
          {/* Feed column */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
          {/* Right sidebar — hidden below xl */}
          <aside className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">
            <SuggestedUsersWidget />
            <TrendingWidget />
          </aside>
        </div>
      </div>
    </div>
  )
}

