import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { likeApi, commentApi, postApi, authApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../ui/Avatar'
import { Modal, Spinner } from '../ui/index'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// PostCard — displays a single post with live like/comment/share counts
//
// FIX: Fetch real like count + comment count from Like and Comment services
// instead of trusting Post.likeCount / Post.commentCount (those are only
// updated via service-to-service HTTP which may fail in some environments).
//
// FIX: Show author's real name/avatar by fetching from Auth service when
// the post only has userId (common when post DTO doesn't include user info).
// ─────────────────────────────────────────────────────────────────────────────

export default function PostCard({ post: initialPost, onDelete, onRepost }) {
  const { user, isGuest } = useAuth()
  const navigate = useNavigate()

  const [post, setPost]           = useState(initialPost)
  const [liked, setLiked]         = useState(null)   // null=loading, true/false=resolved
  const [likeCount, setLikeCount] = useState(initialPost.likeCount || 0)
  const [commentCount, setCommentCount] = useState(initialPost.commentCount || 0)
  const [likeLoading, setLikeLoading]   = useState(false)
  const [showMenu, setShowMenu]   = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareNote, setShareNote] = useState('')
  const [sharing, setSharing]     = useState(false)
  const [showLikers, setShowLikers] = useState(false)
  const [likers, setLikers]       = useState([])
  const [likersLoading, setLikersLoading] = useState(false)
  // Author info (resolved from Auth service if missing)
  const [author, setAuthor]       = useState({
    fullName:  initialPost.fullName  || null,
    userName:  initialPost.userName  || null,
    avatarUrl: initialPost.avatarUrl || null,
  })

  const isOwner = user?.userId === post.userId

  // ── On mount: fetch real counts + like status + author info ─────────────────
  useEffect(() => {
    let cancelled = false

    // Fetch real like count from Like service (source of truth)
    likeApi.count(post.postId, 'POST')
      .then(r => { if (!cancelled) setLikeCount(r.data.count) })
      .catch(() => {})

    // Fetch real comment count from Comment service (source of truth)
    commentApi.count(post.postId)
      .then(r => { if (!cancelled) setCommentCount(r.data.count) })
      .catch(() => {})

    // Fetch whether current user liked this post
    if (user && !isGuest) {
      likeApi.hasLiked(post.postId, 'POST')
        .then(r => { if (!cancelled) setLiked(r.data.hasLiked) })
        .catch(() => { if (!cancelled) setLiked(false) })
    } else {
      setLiked(false)
    }

    // Fetch author info if not included in post DTO
    if (!author.fullName && post.userId) {
      authApi.getById(post.userId)
        .then(r => {
          if (!cancelled) setAuthor({
            fullName:  r.data.fullName,
            userName:  r.data.userName,
            avatarUrl: r.data.avatarUrl,
          })
        })
        .catch(() => {})
    }

    return () => { cancelled = true }
  }, [post.postId, user, isGuest])

  // ── Like ────────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (isGuest) { toast.error('Sign in to like posts'); navigate('/login'); return }
    if (likeLoading || liked === null) return
    setLikeLoading(true)
    const prev = liked
    const prevCount = likeCount
    // Optimistic
    setLiked(!prev)
    setLikeCount(c => c + (prev ? -1 : 1))
    try {
      await likeApi.toggle(post.postId, 'POST')
      // Sync real count from server after toggle
      const r = await likeApi.count(post.postId, 'POST')
      setLikeCount(r.data.count)
    } catch {
      setLiked(prev)
      setLikeCount(prevCount)
      toast.error('Could not update like')
    } finally { setLikeLoading(false) }
  }, [liked, likeLoading, likeCount, post.postId, isGuest, navigate])

  // ── Likers modal ────────────────────────────────────────────────────────────
  const openLikers = async (e) => {
    e.stopPropagation()
    if (isGuest) return
    setShowLikers(true)
    if (likers.length > 0) return
    setLikersLoading(true)
    try {
      const { data } = await likeApi.likers(post.postId)
      setLikers(data)
    } catch {} finally { setLikersLoading(false) }
  }

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = async (type) => {
    if (type === 'copy') {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.postId}`)
      toast.success('Link copied!')
      setShowShare(false)
      return
    }
    setSharing(true)
    try {
      const content = shareNote.trim()
        ? `${shareNote}\n\n🔁 Reposted from @${author.userName || post.userId}`
        : `🔁 Reposted from @${author.userName || post.userId}`
      const { data } = await postApi.repost(post.postId, content)
      setPost(p => ({ ...p, shareCount: (p.shareCount || 0) + 1 }))
      toast.success('Reposted to your feed!')
      setShowShare(false); setShareNote('')
      onRepost?.(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not share post')
    } finally { setSharing(false) }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    setShowMenu(false)
    try {
      await postApi.delete(post.postId)
      toast.success('Post deleted')
      onDelete?.(post.postId)
    } catch { toast.error('Could not delete post') }
  }

  const timeAgo  = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const name     = author.fullName  || `User #${post.userId}`
  const uname    = author.userName  || String(post.userId)
  const avatar   = author.avatarUrl || null

  return (
    <>
      <article className="cs-card p-5 hover:border-cs-muted transition-colors duration-150 animate-fade-up">

        {/* Repost banner */}
        {post.originalPostId && (
          <div className="flex items-center gap-1.5 text-xs text-cs-subtle mb-3 pb-3 border-b border-cs-border">
            <RepostIcon className="w-3.5 h-3.5" />
            <span>Reposted</span>
            <Link to={`/post/${post.originalPostId}`} className="text-cs-accent hover:underline ml-1">
              View original
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Link to={`/profile/${uname}`} className="flex items-center gap-3 group">
            <Avatar src={avatar} name={name} size={40} />
            <div>
              <p className="text-sm font-semibold text-cs-text group-hover:text-cs-accent transition-colors">
                {name}
              </p>
              <p className="text-xs text-cs-subtle">@{uname} · {timeAgo}</p>
            </div>
          </Link>

          {/* Menu */}
          <div className="relative">
            <button onClick={() => setShowMenu(o => !o)}
              className="text-cs-subtle hover:text-cs-text p-1.5 rounded-lg hover:bg-cs-muted transition-colors">
              <DotsIcon className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 w-40 cs-card shadow-xl py-1 animate-fade-in">
                  <Link to={`/post/${post.postId}`} onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-cs-subtle hover:text-cs-text hover:bg-cs-muted">
                    <EyeIcon className="w-3.5 h-3.5" /> View post
                  </Link>
                  {!isGuest && (
                    <button onClick={() => { setShowMenu(false); setShowShare(true) }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-cs-subtle hover:text-cs-text hover:bg-cs-muted">
                      <RepostIcon className="w-3.5 h-3.5" /> Share / Repost
                    </button>
                  )}
                  {(isOwner || user?.isAdmin) && (
                    <button onClick={handleDelete}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-cs-red hover:bg-cs-red/10">
                      <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <Link to={`/post/${post.postId}`} className="block group">
          <p className="text-sm text-cs-text leading-relaxed mb-3 whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Media */}
          {post.mediaUrl && (
            <div className="rounded-xl overflow-hidden mb-3 bg-cs-muted">
              {post.mediaType === 'VIDEO'
                ? <video src={post.mediaUrl} controls className="w-full max-h-80 object-cover"
                    onClick={e => e.preventDefault()} />
                : <img src={post.mediaUrl} alt="Post media"
                    className="w-full max-h-80 object-cover"
                    onError={e => { e.target.style.display = 'none' }} />
              }
            </div>
          )}

          {/* Hashtags */}
          {post.hashtagList?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.hashtagList.map(tag => (
                <span key={tag} onClick={e => { e.preventDefault(); navigate(`/hashtag/${tag.replace('#','')}`); }}
                  className="text-xs text-cs-accent hover:text-amber-300 transition-colors font-medium cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Link>

        {/* Visibility badge */}
        {post.visibility && post.visibility !== 'PUBLIC' && (
          <span className={`badge mb-3 ${post.visibility === 'FOLLOWERS' ? 'badge-blue' : 'badge-purple'}`}>
            {post.visibility === 'FOLLOWERS' ? '👥 Followers only' : '🔒 Only me'}
          </span>
        )}

        {/* ── Action bar — uses likeCount/commentCount from services ── */}
        <div className="flex items-center gap-0.5 pt-2.5 border-t border-cs-border/50">

          {/* Like button */}
          <button onClick={handleLike} disabled={likeLoading || liked === null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${liked === true
                ? 'text-cs-red bg-cs-red/10'
                : 'text-cs-subtle hover:text-cs-red hover:bg-cs-red/10'}`}>
            <HeartIcon className="w-4 h-4" filled={liked === true} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {/* Click likeCount to see likers */}
          {likeCount > 0 && !isGuest && (
            <button onClick={openLikers}
              className="text-xs text-cs-subtle hover:text-cs-accent transition-colors px-1 py-1.5">
              likers
            </button>
          )}

          {/* Comment — navigate to post detail */}
          <Link to={`/post/${post.postId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cs-subtle hover:text-cs-blue hover:bg-cs-blue/10 transition-all">
            <CommentIcon className="w-4 h-4" />
            {commentCount > 0 && <span>{commentCount}</span>}
          </Link>

          {/* Share */}
          <button onClick={() => {
            if (isGuest) { toast.error('Sign in to share'); navigate('/login'); return }
            setShowShare(true)
          }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${(post.shareCount || 0) > 0
                ? 'text-cs-green'
                : 'text-cs-subtle hover:text-cs-green hover:bg-cs-green/10'}`}>
            <RepostIcon className="w-4 h-4" />
            {(post.shareCount || 0) > 0 && <span>{post.shareCount}</span>}
          </button>
        </div>
      </article>

      {/* Share modal */}
      <Modal open={showShare} onClose={() => { setShowShare(false); setShareNote('') }} title="Share Post">
        <div className="bg-cs-muted rounded-xl p-4 mb-4">
          <p className="text-xs text-cs-subtle mb-1">@{uname}</p>
          <p className="text-sm text-cs-text line-clamp-3">{post.content}</p>
        </div>
        <label className="block text-xs text-cs-subtle mb-1.5">Add a note (optional)</label>
        <textarea value={shareNote} onChange={e => setShareNote(e.target.value)}
          placeholder="Say something..." rows={2} maxLength={280}
          className="cs-input resize-none text-sm mb-3" />
        <div className="space-y-2">
          <button onClick={() => handleShare('repost')} disabled={sharing}
            className="btn-primary w-full justify-center py-2.5">
            {sharing ? <Spinner size={16} /> : <><RepostIcon className="w-4 h-4" /> Repost to your feed</>}
          </button>
          <button onClick={() => handleShare('copy')}
            className="btn-ghost w-full justify-center py-2.5 border border-cs-border">
            <LinkIcon className="w-4 h-4" /> Copy link
          </button>
        </div>
      </Modal>

      {/* Likers modal */}
      <Modal open={showLikers} onClose={() => setShowLikers(false)} title={`${likeCount} likes`}>
        {likersLoading
          ? <div className="flex justify-center py-6"><Spinner /></div>
          : likers.length === 0
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
    </>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const HeartIcon   = ({ className, filled }) => <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
const CommentIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const RepostIcon  = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
const DotsIcon    = ({className}) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
const TrashIcon   = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
const EyeIcon     = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
const LinkIcon    = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
