import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { feedApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from './Avatar'
import FollowButton from './FollowButton'

/**
 * "Who to follow" widget — shown in explore/home sidebars.
 * Fetches suggested users from Feed service.
 */
export default function SuggestedUsers() {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!user) return
    feedApi.suggestions(user.userId)
      .then(r => setSuggestions(r.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="cs-card p-4 space-y-3">
        <div className="skeleton h-3 w-32 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-9 h-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-2.5 w-24 rounded" />
              <div className="skeleton h-2 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="cs-card p-4">
      <h3 className="text-xs font-semibold text-cs-subtle uppercase tracking-wider mb-3">
        Who to follow
      </h3>
      <div className="space-y-3">
        {suggestions.map(s => (
          <div key={s.userId} className="flex items-center gap-3">
            <Link to={`/profile/${s.userName}`}>
              <Avatar src={s.avatarUrl} name={s.fullName} size={36} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${s.userName}`}
                className="block text-sm font-semibold text-cs-text hover:text-cs-accent transition-colors truncate">
                {s.fullName}
              </Link>
              <p className="text-xs text-cs-subtle truncate">@{s.userName}</p>
              {s.mutualFollowersCount > 0 && (
                <p className="text-xs text-cs-subtle">{s.mutualFollowersCount} mutual</p>
              )}
            </div>
            <FollowButton targetUserId={s.userId} isPrivate={s.isPrivate} size="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
