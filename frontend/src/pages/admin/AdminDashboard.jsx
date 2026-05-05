import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authApi, postApi } from '../../services/api'
import { PageSpinner } from '../../components/ui/index'

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      authApi.getAllUsers(1, 100),
      postApi.getPublic(1, 100),
      postApi.trendingHashtags(),
      postApi.trending(),
    ]).then(([users, posts, hashtags, trendingPosts]) => {
      setStats({
        totalUsers:  users.data.length,
        totalPosts:  posts.data.length,
        activeUsers: users.data.filter(u => u.isActive).length,
        adminUsers:  users.data.filter(u => u.isAdmin).length,
      })
      setTrending(hashtags.data.slice(0, 5))
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const STAT_CARDS = [
    { label: 'Total Users',   value: stats?.totalUsers,  color: 'text-cs-blue',   bg: 'bg-cs-blue/10',   icon: '👥' },
    { label: 'Active Users',  value: stats?.activeUsers, color: 'text-cs-green',  bg: 'bg-cs-green/10',  icon: '✅' },
    { label: 'Total Posts',   value: stats?.totalPosts,  color: 'text-cs-accent', bg: 'bg-cs-accent/10', icon: '📝' },
    { label: 'Admin Accounts',value: stats?.adminUsers,  color: 'text-cs-purple', bg: 'bg-cs-purple/10', icon: '🛡️' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-cs-text">Admin Dashboard</h1>
        <p className="text-sm text-cs-subtle mt-1">Platform analytics and management</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="cs-card p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
              {s.icon}
            </div>
            <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value ?? '—'}</p>
            <p className="text-xs text-cs-subtle mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links + Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="cs-card p-5">
          <h2 className="font-semibold text-sm text-cs-text mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/admin/users',     label: 'Manage Users',     icon: '👥', desc: 'View, suspend or delete accounts' },
              { to: '/admin/posts',     label: 'Moderate Posts',   icon: '📝', desc: 'Review and delete policy violations' },
              { to: '/admin/broadcast', label: 'Send Broadcast',   icon: '📢', desc: 'Notify all users at once' },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cs-muted transition-colors">
                <span className="text-xl">{a.icon}</span>
                <div>
                  <p className="text-sm font-medium text-cs-text">{a.label}</p>
                  <p className="text-xs text-cs-subtle">{a.desc}</p>
                </div>
                <ArrowIcon className="w-4 h-4 text-cs-subtle ml-auto" />
              </Link>
            ))}
          </div>
        </div>

        {/* Trending hashtags */}
        <div className="cs-card p-5">
          <h2 className="font-semibold text-sm text-cs-text mb-4">Trending Hashtags (48h)</h2>
          {trending.length === 0
            ? <p className="text-sm text-cs-subtle">No trending hashtags yet.</p>
            : <div className="space-y-2">
                {trending.map((h, i) => (
                  <div key={h.hashtag} className="flex items-center justify-between py-2 border-b border-cs-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-cs-accent w-5">#{i+1}</span>
                      <span className="text-sm font-medium text-cs-text">{h.hashtag}</span>
                    </div>
                    <span className="badge-amber text-xs">{h.count} posts</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Role explanation box */}
      <div className="mt-6 cs-card p-5 border-cs-purple/30">
        <h3 className="font-semibold text-sm text-cs-purple mb-3 flex items-center gap-2">
          <span>🛡️</span> Role System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-cs-subtle">
          <div className="bg-cs-muted rounded-xl p-4">
            <p className="font-semibold text-cs-text mb-1">👤 Guest</p>
            <p>Not logged in. Can browse public posts, profiles, and hashtags. Cannot interact.</p>
          </div>
          <div className="bg-cs-muted rounded-xl p-4">
            <p className="font-semibold text-cs-text mb-1">✅ User</p>
            <p>Logged in with <code className="text-cs-accent">isAdmin = false</code>. Full social features — post, like, comment, follow, notifications.</p>
          </div>
          <div className="bg-cs-muted rounded-xl p-4">
            <p className="font-semibold text-cs-text mb-1">🛡️ Admin</p>
            <p>Logged in with <code className="text-cs-accent">isAdmin = true</code> in DB. All user features + this admin panel. JWT role claim = <code className="text-cs-accent">"Admin"</code>.</p>
          </div>
        </div>
        <p className="text-xs text-cs-subtle mt-3">
          To create the first admin: run{' '}
          <code className="text-cs-accent bg-cs-muted px-1.5 py-0.5 rounded">
            UPDATE auth_users SET "IsAdmin" = true WHERE "Email" = 'your@email.com';
          </code>{' '}
          in Neon console.
        </p>
      </div>
    </div>
  )
}

const ArrowIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
