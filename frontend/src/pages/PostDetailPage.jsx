import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postApi, likeApi, commentApi, authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import CommentThread from '../components/comments/CommentThread'
import Avatar from '../components/ui/Avatar'
import { Modal, Spinner } from '../components/ui/index'
import { PageSpinner } from '../components/ui/index'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// PostDetailPage — full post view with live-updating like/comment counts
//
// Fix: post is stored in local state so likeCount & commentCount
// update in real-time when the user interacts, without a page refresh.
// ─────────────────────────────────────────────────────────────────────────────

export default function PostDetailPage() {
  const { postId }  = useParams()
  const navigate    = useNavigate()
  const { user, isGuest } = useAuth()

  const [post, setPost]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [liked, setLiked]       = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [likeCount, setLikeCount]     = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [author, setAuthor]     = useState(null)
  const [showLikers, setShowLikers]   = useState(false)
  const [likers, setLikers]     = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareNote, setShareNote] = useState('')
  const [sharing, setSharing]   = useState(false)

  useEffect(() => {
    setLoading(true)
    postApi.getById(postId)
      .then(r => {
        const p = r.data
        setPost(p)
        setLikeCount(p.likeCount || 0)
        setCommentCount(p.commentCount || 0)
        // Fetch real counts from source-of-truth services
        likeApi.count(p.postId, 'POST').then(lr => setLikeCount(lr.data.count)).catch(() => {})
        commentApi.count(p.postId).then(cr => setCommentCount(cr.data.count)).catch(() => {})
        // Fetch like status
        if (user) {
          likeApi.hasLiked(p.postId, 'POST')
            .then(lr => setLiked(lr.data.hasLiked))
            .catch(() => {})
        }
        // Fetch author info if not in DTO
        if (!p.fullName && p.userId) {
          authApi.getById(p.userId).then(ar => setAuthor(ar.data)).catch(() => {})
        } else {
          setAuthor({ fullName: p.fullName, userName: p.userName, avatarUrl: p.avatarUrl })
        }
      })
      .catch(() => { toast.error('Post not found'); navigate('/') })
      .finally(() => setLoading(false))
  }, [postId, navigate, user])

  // ── Like ─────────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (isGuest) { toast.error('Sign in to like'); navigate('/login'); return }
    if (likeLoading) return
    setLikeLoading(true)
    const prev = liked
    const prevCount = likeCount
    setLiked(!prev)
    setLikeCount(c => c + (prev ? -1 : 1))
    try {
      await likeApi.toggle(Number(postId), 'POST')
      // Sync real count
      const r = await likeApi.count(Number(postId), 'POST')
      setLikeCount(r.data.count)
    } catch {
      setLiked(prev)
      setLikeCount(prevCount)
      toast.error('Could not update like')
    } finally { setLikeLoading(false) }
  }, [liked, likeLoading, postId, isGuest, navigate])

  // ── Comment added callback (from CommentThread) ───────────────────────────────
  const handleCommentAdded = useCallback(() => {
    setCommentCount(c => c + 1)
    setPost(p => p ? { ...p, commentCount: p.commentCount + 1 } : p)
  }, [])

  // ── View likers ──────────────────────────────────────────────────────────────
  const openLikers = async () => {
    setShowLikers(true)
    if (likers.length > 0) return
    try {
      const { data } = await likeApi.likers(Number(postId))
      setLikers(data)
    } catch {}
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      await postApi.delete(post.postId)
      toast.success('Post deleted')
      navigate('/')
    } catch { toast.error('Could not delete') }
  }

  // ── Share / copy ─────────────────────────────────────────────────────────────
  const handleShare = async (type) => {
    if (type === 'copy') {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
      setShowShare(false)
      return
    }
    setSharing(true)
    try {
      const content = shareNote.trim()
        ? `${shareNote}\n\n🔁 Reposted from @${post.userName || post.userId}`
        : `🔁 Reposted from @${post.userName || post.userId}`
      await postApi.repost(post.postId, content)
      setPost(p => ({ ...p, shareCount: p.shareCount + 1 }))
      toast.success('Reposted to your feed!')
      setShowShare(false); setShareNote('')
    } catch { toast.error('Could not repost') }
    finally { setSharing(false) }
  }

  if (loading) return <PageSpinner />
  if (!post)   return null

  const isOwner  = user?.userId === post.userId
  const timeAgo  = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-cs-subtle hover:text-cs-text mb-4 transition-colors">
        <ArrowIcon className="w-4 h-4" /> Back
      </button>

      {/* ── Post card (inline — not PostCard component so we can wire callbacks) ── */}
      <div className="cs-card p-5 mb-3 animate-fade-up">

        {/* Repost banner */}
        {post.originalPostId && (
          <div className="flex items-center gap-1.5 text-xs text-cs-subtle mb-3 pb-3 border-b border-cs-border">
            <RepostIcon className="w-3.5 h-3.5" />
            Reposted ·
            <Link to={`/post/${post.originalPostId}`} className="text-cs-accent hover:underline">
              View original
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <Link to={`/profile/${author?.userName || post.userName || post.userId}`} className="flex items-center gap-3 group">
            <Avatar src={author?.avatarUrl || post.avatarUrl} name={author?.fullName || post.fullName || 'User'} size={44} />
            <div>
              <p className="font-semibold text-cs-text group-hover:text-cs-accent transition-colors">
                {author?.fullName || post.fullName || `User #${post.userId}`}
              </p>
              <p className="text-xs text-cs-subtle">@{author?.userName || post.userName || post.userId} · {timeAgo}</p>
            </div>
          </Link>

          {/* Menu */}
          {(isOwner || user?.isAdmin) && (
            <div className="relative">
              <button onClick={() => setShowMenu(o => !o)}
                className="text-cs-subtle hover:text-cs-text p-1.5 rounded-lg hover:bg-cs-muted">
                <DotsIcon className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 w-36 cs-card shadow-xl py-1 animate-fade-in">
                    <button onClick={handleDelete}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-cs-red hover:bg-cs-red/10">
                      <TrashIcon className="w-3.5 h-3.5" /> Delete post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <p className="text-base text-cs-text leading-relaxed mb-4 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Media */}
        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden mb-4 bg-cs-muted">
            {post.mediaType === 'VIDEO'
              ? <video src={post.mediaUrl} controls className="w-full max-h-[500px] object-contain" />
              : <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[500px] object-contain" />
            }
          </div>
        )}

        {/* Hashtags */}
        {post.hashtagList?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.hashtagList.map(tag => (
              <Link key={tag} to={`/hashtag/${tag.replace('#','')}`}
                className="text-sm text-cs-accent hover:text-amber-300 transition-colors font-medium">
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Stats row */}
        {(likeCount > 0 || commentCount > 0 || (post.shareCount || 0) > 0) && (
          <div className="flex items-center gap-4 py-3 border-y border-cs-border text-xs text-cs-subtle mb-3">
            {likeCount > 0 && (
              <button onClick={openLikers} className="hover:text-cs-accent transition-colors">
                <span className="font-semibold text-cs-text">{likeCount}</span> {likeCount === 1 ? 'like' : 'likes'}
              </button>
            )}
            {commentCount > 0 && (
              <span>
                <span className="font-semibold text-cs-text">{commentCount}</span> {commentCount === 1 ? 'comment' : 'comments'}
              </span>
            )}
            {post.shareCount > 0 && (
              <span>
                <span className="font-semibold text-cs-text">{post.shareCount}</span> {post.shareCount === 1 ? 'share' : 'shares'}
              </span>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1">
          {/* Like */}
          <button onClick={handleLike} disabled={likeLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center
              ${liked ? 'text-cs-red bg-cs-red/10' : 'text-cs-subtle hover:text-cs-red hover:bg-cs-red/10'}`}>
            <HeartIcon className="w-5 h-5" filled={liked === true} />
            {liked ? 'Liked' : 'Like'}
          </button>

          {/* Comment — scroll to comment box */}
          <button onClick={() => document.getElementById('comment-input')?.focus()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-cs-subtle hover:text-cs-blue hover:bg-cs-blue/10 transition-all flex-1 justify-center">
            <CommentIcon className="w-5 h-5" />
            Comment
          </button>

          {/* Share */}
          <button onClick={() => {
            if (isGuest) { toast.error('Sign in to share'); return }
            setShowShare(true)
          }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-cs-subtle hover:text-cs-green hover:bg-cs-green/10 transition-all flex-1 justify-center">
            <RepostIcon className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="cs-card p-5">
        <h2 className="font-semibold text-sm text-cs-text mb-5 flex items-center gap-2">
          <CommentIcon className="w-4 h-4 text-cs-subtle" />
          Comments
          {commentCount > 0 && (
            <span className="badge-blue text-xs ml-1">{commentCount}</span>
          )}
        </h2>
        {/* Pass onCommentAdded so the count updates live */}
        <CommentThread postId={Number(postId)} onCommentAdded={handleCommentAdded} />
      </div>

      {/* Share modal */}
      <Modal open={showShare} onClose={() => { setShowShare(false); setShareNote('') }} title="Share Post">
        <div className="bg-cs-muted rounded-xl p-4 mb-4">
          <p className="text-xs text-cs-subtle mb-1">@{post.userName}</p>
          <p className="text-sm text-cs-text line-clamp-3">{post.content}</p>
        </div>
        <textarea value={shareNote} onChange={e => setShareNote(e.target.value)}
          placeholder="Add a comment (optional)..." rows={2} maxLength={280}
          className="cs-input resize-none text-sm mb-3" />
        <div className="space-y-2">
          <button onClick={() => handleShare('repost')} disabled={sharing} className="btn-primary w-full justify-center py-2.5">
            {sharing ? <Spinner size={16} /> : <><RepostIcon className="w-4 h-4" /> Repost to your feed</>}
          </button>
          <button onClick={() => handleShare('copy')} className="btn-ghost w-full justify-center py-2.5 border border-cs-border">
            Copy link
          </button>
        </div>
      </Modal>

      {/* Likers modal */}
      <Modal open={showLikers} onClose={() => setShowLikers(false)} title={`${post.likeCount} likes`}>
        {likers.length === 0
          ? <p className="text-sm text-cs-subtle text-center py-4">No likes yet</p>
          : <div className="space-y-3 max-h-64 overflow-y-auto">
              {likers.map(uid => (
                <div key={uid} className="flex items-center gap-3">
                  <Avatar name={`User ${uid}`} size={34} />
                  <span className="text-sm text-cs-text">User #{uid}</span>
                </div>
              ))}
            </div>
        }
      </Modal>
    </div>
  )
}

const ArrowIcon   = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7"/></svg>
const HeartIcon   = ({ className, filled }) => <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
const CommentIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const RepostIcon  = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
const TrashIcon   = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
const DotsIcon    = ({className}) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
