import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { postApi, followApi } from '../services/api'
import PostCard from '../components/posts/PostCard'
import { PostSkeleton, EmptyState } from '../components/ui/index'

const TABS = ['Trending', 'Explore', 'Hashtags']

export default function ExplorePage() {
  const { user } = useAuth()
  const [tab, setTab]           = useState('Trending')
  const [trending, setTrending] = useState([])
  const [explore, setExplore]   = useState([])
  const [hashtags, setHashtags] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)

    if (tab === 'Trending') {
      postApi.trending()
        .then(r => setTrending(r.data || []))
        .catch(() => {})
        .finally(() => setLoading(false))

    } else if (tab === 'Explore') {
      // Fetch public posts and filter out posts by people user follows
      Promise.all([
        postApi.getPublic(1, 50),
        followApi.followingIds(user.userId).catch(() => ({ data: [] })),
      ]).then(([postsRes, followingRes]) => {
        const followingIds = new Set(followingRes.data || [])
        const filtered = (postsRes.data || [])
          .filter(p => !followingIds.has(p.userId) && p.userId !== user.userId)
          .sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount))
        setExplore(filtered)
      }).catch(() => {}).finally(() => setLoading(false))

    } else if (tab === 'Hashtags') {
      postApi.trendingHashtags()
        .then(r => setHashtags(r.data || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [tab, user.userId])

  const handleDelete = (postId) => {
    setTrending(p => p.filter(x => x.postId !== postId))
    setExplore(p => p.filter(x => x.postId !== postId))
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-cs-text">Explore</h1>
        <p className="text-sm text-cs-subtle mt-0.5">Discover what's happening on ConnectSphere</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-cs-surface border border-cs-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${tab === t ? 'bg-cs-accent text-cs-bg shadow-sm' : 'text-cs-subtle hover:text-cs-text'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* Trending posts with rank badge */}
          {tab === 'Trending' && (
            trending.length === 0
              ? <EmptyState icon="🔥" title="Nothing trending yet" subtitle="Be the first to post!" />
              : <div className="space-y-3">
                  {trending.map((p, i) => (
                    <div key={p.postId} className="relative">
                      <div className="absolute -left-1 -top-1 z-10 w-7 h-7 rounded-full bg-cs-accent text-cs-bg text-xs font-bold flex items-center justify-center shadow-lg">
                        {i + 1}
                      </div>
                      <PostCard post={p} onDelete={handleDelete} />
                    </div>
                  ))}
                </div>
          )}

          {/* Explore feed — public posts from non-followed users */}
          {tab === 'Explore' && (
            explore.length === 0
              ? <EmptyState icon="🌍" title="Nothing to explore yet"
                  subtitle="Follow more people to get a personalised explore feed." />
              : <div className="space-y-3">
                  {explore.map(p => <PostCard key={p.postId} post={p} onDelete={handleDelete} />)}
                </div>
          )}

          {/* Trending hashtags */}
          {tab === 'Hashtags' && (
            hashtags.length === 0
              ? <EmptyState icon="#️⃣" title="No trending hashtags yet"
                  subtitle="Add hashtags when creating posts to make them discoverable." />
              : <div className="space-y-2">
                  {hashtags.map((h, i) => (
                    <Link key={h.hashtag} to={`/hashtag/${h.hashtag.replace('#','')}`}
                      className="cs-card flex items-center justify-between px-5 py-4 hover:border-cs-muted transition-all group">
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-cs-accent w-7 text-center">{i + 1}</span>
                        <div>
                          <p className="font-semibold text-sm text-cs-text group-hover:text-cs-accent transition-colors">
                            {h.hashtag}
                          </p>
                          <p className="text-xs text-cs-subtle">{h.count} {h.count === 1 ? 'post' : 'posts'} in 48 hours</p>
                        </div>
                      </div>
                      <ChevronIcon className="w-4 h-4 text-cs-subtle group-hover:text-cs-accent transition-colors" />
                    </Link>
                  ))}
                </div>
          )}
        </>
      )}
    </div>
  )
}

const ChevronIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
