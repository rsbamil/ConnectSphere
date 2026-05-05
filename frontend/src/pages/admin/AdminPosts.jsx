// ── AdminPosts ────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { postApi } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import { PageSpinner, EmptyState } from '../../components/ui/index'
import toast from 'react-hot-toast'

export function AdminPosts() {
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postApi.getPublic(1, 50)
      .then(r => setPosts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return
    try {
      await postApi.delete(postId)
      setPosts(ps => ps.filter(p => p.postId !== postId))
      toast.success('Post deleted')
    } catch { toast.error('Failed to delete post') }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-cs-text">Posts Moderation</h1>
        <p className="text-sm text-cs-subtle mt-0.5">{posts.length} public posts</p>
      </div>

      {posts.length === 0
        ? <EmptyState icon="📝" title="No posts found" />
        : (
          <div className="space-y-3">
            {posts.map(p => (
              <div key={p.postId} className="cs-card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-cs-subtle">User #{p.userId}</span>
                    <span className="text-cs-border">·</span>
                    <span className="text-xs text-cs-subtle">
                      {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                    </span>
                    <span className="badge-blue text-xs">{p.visibility}</span>
                  </div>
                  <p className="text-sm text-cs-text line-clamp-3">{p.content}</p>
                  {p.hashtags && (
                    <p className="text-xs text-cs-accent mt-1">{p.hashtags}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-cs-subtle">
                    <span>❤️ {p.likeCount}</span>
                    <span>💬 {p.commentCount}</span>
                    <span>🔁 {p.shareCount}</span>
                  </div>
                </div>
                <button onClick={() => deletePost(p.postId)} className="btn-danger text-xs flex-shrink-0">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

export default AdminPosts
