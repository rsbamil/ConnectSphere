// ── HashtagPage ───────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postApi } from '../services/api'
import PostCard from '../components/posts/PostCard'
import { PostSkeleton, EmptyState } from '../components/ui/index'

export function HashtagPage() {
  const { tag } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    postApi.byHashtag(tag)
      .then(r => setPosts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tag])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-cs-text">#{tag}</h1>
        <p className="text-sm text-cs-subtle mt-0.5">{posts.length} public posts</p>
      </div>
      {loading
        ? [...Array(3)].map((_, i) => <PostSkeleton key={i} />)
        : posts.length === 0
          ? <EmptyState icon="#" title={`No posts tagged #${tag}`} />
          : <div className="space-y-3">
              {posts.map(p => <PostCard key={p.postId} post={p} onDelete={id => setPosts(ps => ps.filter(x => x.postId !== id))} />)}
            </div>
      }
    </div>
  )
}

export default HashtagPage
