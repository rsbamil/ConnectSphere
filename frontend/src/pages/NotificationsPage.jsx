// ── NotificationsPage ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { notifApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { PageSpinner, EmptyState } from '../components/ui/index'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  LIKE_POST:       { icon: '❤️', color: 'text-cs-red' },
  LIKE_COMMENT:    { icon: '❤️', color: 'text-cs-red' },
  NEW_COMMENT:     { icon: '💬', color: 'text-cs-blue' },
  NEW_REPLY:       { icon: '↩️', color: 'text-cs-blue' },
  NEW_FOLLOWER:    { icon: '👤', color: 'text-cs-green' },
  FOLLOW_REQUEST:  { icon: '🔔', color: 'text-cs-accent' },
  FOLLOW_ACCEPTED: { icon: '✅', color: 'text-cs-green' },
  MENTION:         { icon: '@',  color: 'text-cs-purple' },
  PLATFORM:        { icon: '📢', color: 'text-cs-accent' },
}

export function NotificationsPage() {
  const { user } = useAuth()
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notifApi.get(user.userId)
      .then(r => setNotifs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.userId])

  const markAllRead = async () => {
    await notifApi.markAllRead(user.userId)
    setNotifs(ns => ns.map(n => ({ ...n, isRead: true })))
    toast.success('All marked as read')
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-bold text-2xl text-cs-text">Notifications</h1>
        {notifs.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="btn-ghost text-xs">Mark all read</button>
        )}
      </div>

      {notifs.length === 0
        ? <EmptyState icon="🔔" title="No notifications yet" subtitle="Interact with people to see activity here." />
        : (
          <div className="space-y-1">
            {notifs.map(n => {
              const cfg = TYPE_CONFIG[n.type] || { icon: '🔔', color: 'text-cs-subtle' }
              return (
                <div key={n.notificationId}
                  className={`flex items-start gap-4 px-4 py-3.5 rounded-xl transition-colors cursor-pointer
                    ${n.isRead ? 'hover:bg-cs-surface' : 'bg-cs-surface border border-cs-border hover:border-cs-muted'}`}
                  onClick={() => {
                    notifApi.markRead(n.notificationId)
                    setNotifs(ns => ns.map(x => x.notificationId === n.notificationId ? { ...x, isRead: true } : x))
                  }}>
                  <span className="text-xl mt-0.5">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.isRead ? 'text-cs-subtle' : 'text-cs-text font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-cs-subtle mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-cs-accent mt-2 flex-shrink-0 animate-pulse-dot" />
                  )}
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

export default NotificationsPage
