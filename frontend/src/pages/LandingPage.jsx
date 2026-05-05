import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { postApi } from '../services/api'
import PostCard from '../components/posts/PostCard'
import { PostSkeleton } from '../components/ui/index'

export default function LandingPage() {
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postApi.trending()
      .then(r => setPosts(r.data.slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-6 pt-24 pb-20 text-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-80 h-80 bg-cs-accent/8 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-60 h-60 bg-cs-blue/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cs-surface border border-cs-border text-xs text-cs-subtle mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cs-green animate-pulse-dot" />
            Now live — join thousands of creators
          </div>

          <h1 className="font-display font-bold text-5xl md:text-6xl text-cs-text mb-4 leading-tight">
            Share. Connect.<br />
            <span className="text-cs-accent">Discover.</span>
          </h1>

          <p className="text-lg text-cs-subtle mb-10 leading-relaxed max-w-lg mx-auto">
            ConnectSphere is a social platform built for real conversations.
            Post, like, comment, follow — your world, your rules.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary text-base px-6 py-3">
              Get started — it's free
            </Link>
            <Link to="/login" className="btn-ghost text-base px-6 py-3 border border-cs-border">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Feature pills */}
      <section className="px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {['Posts & Media', 'Nested Comments', 'Follow Graph', 'Real-time Notifications',
              'Trending Hashtags', 'Explore Feed', 'Private Accounts'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-cs-surface border border-cs-border text-xs text-cs-subtle">
                {f}
              </span>
            ))}
          </div>

          {/* Live trending posts */}
          <h2 className="font-display font-bold text-2xl text-cs-text mb-4 text-center">
            Trending right now
          </h2>
          <div className="space-y-3">
            {loading
              ? [...Array(2)].map((_, i) => <PostSkeleton key={i} />)
              : posts.map(p => <PostCard key={p.postId} post={p} />)
            }
          </div>

          <div className="text-center mt-8">
            <Link to="/register" className="btn-primary px-8 py-3">
              Join to see more →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
