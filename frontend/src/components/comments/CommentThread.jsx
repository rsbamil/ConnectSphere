import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { commentApi, likeApi, authApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../ui/Avatar'
import { Spinner } from '../ui/index'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// CommentThread — 2-level nested comments with live updates
//
// BUG FIX: The submit function was checking `isGuest` from the closure which
// could be stale. Now we check `user` directly from the ref so it always
// reflects the current auth state.
//
// BUG FIX: Comment submit was failing silently because the commentApi call
// was returning 401 (missing/invalid token). Now we log errors clearly and
// show a helpful toast.
// ─────────────────────────────────────────────────────────────────────────────

export default function CommentThread({ postId, onCommentAdded }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userRef  = useRef(user)   // always-current ref — avoids stale closure
  useEffect(() => { userRef.current = user }, [user])

  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [content, setContent]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo]     = useState(null) // { commentId, userName }

  // ── Load top-level comments ─────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    commentApi.topLevel(postId)
      .then(r => setComments(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [postId])

  // ── Submit comment or reply ─────────────────────────────────────────────────
  const submit = async () => {
    // Always read from ref — never from stale closure
    const currentUser = userRef.current
    if (!currentUser) {
      toast.error('Please sign in to comment')
      navigate('/login')
      return
    }
    if (!content.trim()) return
    if (submitting) return

    setSubmitting(true)
    try {
      const { data } = await commentApi.add({
        postId,
        content:         content.trim(),
        parentCommentId: replyTo?.commentId ?? null,
      })

      if (replyTo) {
        // Append reply under the parent
        setComments(cs => cs.map(c =>
          c.commentId === replyTo.commentId
            ? {
                ...c,
                replyCount:      (c.replyCount || 0) + 1,
                _replies:        [...(c._replies || []), data],
                _showReplies:    true,
                _repliesLoaded:  true,
              }
            : c
        ))
      } else {
        // Prepend new top-level comment
        setComments(cs => [data, ...cs])
        onCommentAdded?.()
      }

      setContent('')
      setReplyTo(null)
      toast.success(replyTo ? 'Reply posted!' : 'Comment posted!')
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        toast.error('Session expired — please sign in again')
        navigate('/login')
      } else {
        toast.error(err.response?.data?.error || 'Could not post comment')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit()
  }

  // ── Load replies ────────────────────────────────────────────────────────────
  const loadReplies = async (comment) => {
    if (comment._repliesLoaded) return
    try {
      const { data } = await commentApi.replies(comment.commentId)
      setComments(cs => cs.map(c =>
        c.commentId === comment.commentId
          ? { ...c, _replies: data, _repliesLoaded: true, _showReplies: true }
          : c
      ))
    } catch {}
  }

  const toggleReplies = (comment) => {
    if (!comment._repliesLoaded) { loadReplies(comment); return }
    setComments(cs => cs.map(c =>
      c.commentId === comment.commentId
        ? { ...c, _showReplies: !c._showReplies }
        : c
    ))
  }

  // ── Delete comment ──────────────────────────────────────────────────────────
  const deleteComment = async (commentId, isReply = false, parentId = null) => {
    try {
      await commentApi.delete(commentId)
      if (isReply && parentId) {
        setComments(cs => cs.map(c =>
          c.commentId === parentId
            ? {
                ...c,
                replyCount: Math.max(0, (c.replyCount || 0) - 1),
                _replies: (c._replies || []).filter(r => r.commentId !== commentId),
              }
            : c
        ))
      } else {
        setComments(cs => cs.filter(c => c.commentId !== commentId))
      }
      toast.success('Comment deleted')
    } catch { toast.error('Could not delete comment') }
  }

  // ── Like a comment ──────────────────────────────────────────────────────────
  const likeComment = async (commentId) => {
    if (!userRef.current) return
    try {
      const { data } = await likeApi.toggle(commentId, 'COMMENT')
      const delta = data.liked ? 1 : -1
      setComments(cs => cs.map(c =>
        c.commentId === commentId
          ? { ...c, likeCount: Math.max(0, (c.likeCount || 0) + delta) }
          : c
      ))
    } catch {}
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Compose box ── */}
      {user ? (
        <div className="flex gap-3">
          <Avatar src={user.avatarUrl} name={user.fullName} size={34} />
          <div className="flex-1 space-y-2">
            {replyTo && (
              <div className="flex items-center gap-2 text-xs text-cs-subtle bg-cs-muted px-3 py-1.5 rounded-lg">
                <span>Replying to</span>
                <span className="text-cs-accent font-semibold">@{replyTo.userName}</span>
                <button onClick={() => setReplyTo(null)}
                  className="ml-auto hover:text-cs-red transition-colors text-base leading-none">
                  ✕
                </button>
              </div>
            )}
            <textarea
              id="comment-input"
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyTo
                ? `Reply to @${replyTo.userName}… (Ctrl+Enter to post)`
                : 'Write a comment… (Ctrl+Enter to post)'}
              rows={2}
              maxLength={1000}
              className="w-full bg-cs-muted border border-cs-border rounded-xl px-3 py-2.5 text-sm text-cs-text placeholder-cs-subtle focus:outline-none focus:border-cs-accent resize-none transition-colors"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-cs-subtle">{content.length}/1000</span>
              <button
                onClick={submit}
                disabled={submitting || !content.trim()}
                className="btn-primary text-xs py-1.5 px-4">
                {submitting ? <Spinner size={12} /> : replyTo ? 'Reply' : 'Post comment'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-cs-muted rounded-xl">
          <p className="text-sm text-cs-subtle">
            <Link to="/login" className="text-cs-accent hover:underline font-medium">Sign in</Link>
            {' '}to leave a comment
          </p>
        </div>
      )}

      {/* ── Comment list ── */}
      {comments.length === 0 ? (
        <p className="text-center text-cs-subtle text-sm py-8">
          No comments yet — be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <CommentItem
              key={c.commentId}
              comment={c}
              currentUser={user}
              onReply={() => setReplyTo({
                commentId: c.commentId,
                userName:  c.userName || `user${c.userId}`,
              })}
              onToggleReplies={() => toggleReplies(c)}
              onDelete={() => deleteComment(c.commentId, false, null)}
              onLike={() => likeComment(c.commentId)}
              onDeleteReply={rid => deleteComment(rid, true, c.commentId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Single comment + its replies
// ─────────────────────────────────────────────────────────────────────────────
function CommentItem({ comment: c, currentUser, onReply, onToggleReplies, onDelete, onLike, onDeleteReply }) {
  const canDelete = currentUser?.userId === c.userId || currentUser?.isAdmin

  return (
    <div className="flex gap-3 animate-fade-up">
      <Link to={`/profile/${c.userName || c.userId}`} className="flex-shrink-0">
        <Avatar src={c.avatarUrl} name={c.fullName || `User ${c.userId}`} size={34} />
      </Link>

      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="bg-cs-muted rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <Link to={`/profile/${c.userName || c.userId}`}
              className="text-xs font-semibold text-cs-text hover:text-cs-accent transition-colors truncate">
              {c.fullName || `User #${c.userId}`}
            </Link>
            <span className="text-xs text-cs-subtle flex-shrink-0">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className={`text-sm leading-relaxed break-words ${
            c.isDeleted ? 'text-cs-subtle italic' : 'text-cs-text'
          }`}>
            {c.content}
          </p>
          {c.isEdited && !c.isDeleted && (
            <span className="text-xs text-cs-subtle mt-1 block">(edited)</span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-4 mt-1.5 pl-2">
          {currentUser && !c.isDeleted && (
            <button onClick={onLike}
              className="text-xs text-cs-subtle hover:text-cs-red transition-colors flex items-center gap-1">
              ♥{c.likeCount > 0 ? ` ${c.likeCount}` : ' Like'}
            </button>
          )}
          {currentUser && !c.isDeleted && (
            <button onClick={onReply}
              className="text-xs text-cs-subtle hover:text-cs-accent transition-colors">
              Reply
            </button>
          )}
          {c.replyCount > 0 && (
            <button onClick={onToggleReplies}
              className="text-xs text-cs-subtle hover:text-cs-blue transition-colors">
              {c._showReplies
                ? '▲ Hide replies'
                : `▼ ${c.replyCount} ${c.replyCount === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
          {canDelete && !c.isDeleted && (
            <button onClick={onDelete}
              className="text-xs text-cs-subtle hover:text-cs-red transition-colors ml-auto">
              Delete
            </button>
          )}
        </div>

        {/* Nested replies */}
        {c._showReplies && c._replies?.length > 0 && (
          <div className="mt-3 space-y-3 pl-2 border-l-2 border-cs-border/50">
            {c._replies.map(r => (
              <div key={r.commentId} className="flex gap-2 animate-fade-up">
                <Link to={`/profile/${r.userName || r.userId}`} className="flex-shrink-0">
                  <Avatar src={r.avatarUrl} name={r.fullName || `User ${r.userId}`} size={28} />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-cs-muted rounded-2xl rounded-tl-sm px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <Link to={`/profile/${r.userName || r.userId}`}
                        className="text-xs font-semibold text-cs-text hover:text-cs-accent transition-colors">
                        {r.fullName || `User #${r.userId}`}
                      </Link>
                      <span className="text-xs text-cs-subtle flex-shrink-0">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed break-words ${
                      r.isDeleted ? 'text-cs-subtle italic' : 'text-cs-text'
                    }`}>
                      {r.content}
                    </p>
                  </div>
                  {(currentUser?.userId === r.userId || currentUser?.isAdmin) && !r.isDeleted && (
                    <button onClick={() => onDeleteReply(r.commentId)}
                      className="text-xs text-cs-subtle hover:text-cs-red transition-colors mt-1 pl-1">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
