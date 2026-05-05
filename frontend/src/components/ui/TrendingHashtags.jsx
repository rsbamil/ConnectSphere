import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { postApi } from '../../services/api'

/**
 * "Trending" hashtags sidebar widget.
 * Top 8 hashtags from the last 48 hours.
 */
export default function TrendingHashtags() {
  const [tags, setTags]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postApi.trendingHashtags()
      .then(r => setTags(r.data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="cs-card p-4 space-y-2">
        <div className="skeleton h-3 w-28 rounded mb-3" />
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-3 rounded" style={{width: `${70 - i*8}%`}} />)}
      </div>
    )
  }

  if (tags.length === 0) return null

  return (
    <div className="cs-card p-4">
      <h3 className="text-xs font-semibold text-cs-subtle uppercase tracking-wider mb-3">
        Trending
      </h3>
      <div className="space-y-1">
        {tags.map((t, i) => (
          <Link key={t.hashtag} to={`/hashtag/${t.hashtag.replace('#', '')}`}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-cs-muted transition-colors group">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-cs-subtle w-4 text-right">{i + 1}</span>
              <span className="text-sm font-medium text-cs-accent group-hover:text-amber-300 transition-colors">
                {t.hashtag}
              </span>
            </div>
            <span className="text-xs text-cs-subtle">{t.count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
