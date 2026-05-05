import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const DashIcon  = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z"/></svg>
const UsersIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
const PostsIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
const BellIcon  = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>

const ADMIN_NAV = [
  { to: '/admin',           label: 'Dashboard',     icon: DashIcon },
  { to: '/admin/users',     label: 'Users',          icon: UsersIcon },
  { to: '/admin/posts',     label: 'Posts',          icon: PostsIcon },
  { to: '/admin/broadcast', label: 'Broadcast',      icon: BellIcon },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cs-bg flex">
      {/* Admin sidebar */}
      <aside className="w-56 fixed inset-y-0 left-0 bg-cs-surface border-r border-cs-border flex flex-col z-20">
        <div className="px-5 py-4 border-b border-cs-border">
          <div className="flex items-center gap-2">
            <span className="badge-purple">Admin</span>
            <span className="font-display font-bold text-cs-text text-sm">ConnectSphere</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive ? 'bg-cs-purple/10 text-cs-purple' : 'text-cs-subtle hover:text-cs-text hover:bg-cs-muted'}`
              }>
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-cs-border space-y-1">
          <NavLink to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-cs-subtle hover:text-cs-text hover:bg-cs-muted transition-colors">
            ← Back to App
          </NavLink>
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs text-cs-red hover:bg-cs-red/10 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-56 min-h-screen bg-cs-bg">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

