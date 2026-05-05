import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { postApi, followApi } from '../services/api'
import PostCard from '../components/posts/PostCard'
import CreatePostForm from '../components/posts/CreatePostForm'
import { EmptyState, PostSkeleton } from '../components/ui/index'

// ─────────────────────────────────────────────────────────────────────────────
// HomePage — Home Feed
//
// FIX: Build the feed ourselves instead of calling the Feed microservice
// (which depends on Redis + RabbitMQ + Follow service all running perfectly).
//
// Strategy:
//   1. Fetch the current user's own posts from Post service
//   2. Fetch the list of user IDs they follow from Follow service  
//   3. Fetch posts for each followed user from Post service
//   4. Merge, sort by createdAt descending, deduplicate
//
// This makes the home feed work even without Redis/RabbitMQ.
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const followingIdsRef = useRef([])

  // Build feed: own posts + followed users' posts, sorted newest first
  const buildFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      // Step 1: Get following IDs (only once, cache in ref)
      if (followingIdsRef.current.length === 0 && pageNum === 1) {
        try {
          const fr = await followApi.followingIds(user.userId)
          followingIdsRef.current = fr.data || []
        } catch {
          followingIdsRef.current = []
        }
      }

      const followingIds = followingIdsRef.current

      // Step 2: Fetch own posts + each followed user's posts in parallel
      const allFetches = [
        postApi.byUser(user.userId, pageNum).catch(() => ({ data: [] })),
        ...followingIds.slice(0, 20).map(fid =>   // cap at 20 to avoid too many requests
          postApi.byUser(fid, 1).catch(() => ({ data: [] }))
        ),
      ]

      const results = await Promise.all(allFetches)

      // Step 3: Merge all posts, deduplicate by postId, sort newest first
      const allPosts = results.flatMap(r => r.data || [])
      const seen = new Set()
      const unique = allPosts
        .filter(p => { if (seen.has(p.postId)) return false; seen.add(p.postId); return true })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      // Paginate client-side: 10 per page
      const pageSize = 10
      const start    = (pageNum - 1) * pageSize
      const slice    = unique.slice(start, start + pageSize)

      if (append) setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.postId))
        return [...prev, ...slice.filter(p => !existingIds.has(p.postId))]
      })
      else setPosts(slice)

      setHasMore(slice.length === pageSize)
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [user.userId])

  useEffect(() => {
    setLoading(true)
    setPosts([])
    setPage(1)
    followingIdsRef.current = []
    buildFeed(1, false)
  }, [buildFeed])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = page + 1
    setPage(next)
    buildFeed(next, true)
  }

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.postId !== postId))
  }

  if (loading) {
    return (
      <div>
        <div className="mb-4 h-32 cs-card animate-pulse rounded-2xl" />
        {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-cs-text">Home</h1>
        <p className="text-sm text-cs-subtle mt-0.5">Your posts and people you follow</p>
      </div>

      <CreatePostForm onCreated={handlePostCreated} />

      {posts.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="Your feed is empty"
          subtitle="Create your first post above, or follow some people to see their posts here."
        />
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard key={post.postId} post={post} onDelete={handlePostDeleted} />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button onClick={loadMore} disabled={loadingMore}
                className="btn-ghost text-sm px-8 py-2">
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
