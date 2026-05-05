import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { followApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Spinner } from './index'
import toast from 'react-hot-toast'

/**
 * Self-contained follow/unfollow button.
 *
 * FIX for "follow reverts" bug:
 *   - Status is set OPTIMISTICALLY before the API call
 *   - Only reverted if the API call actually fails
 *   - A ref guards against double-clicks during the request
 *   - Initial fetch only runs once (cancelled on unmount)
 *   - `initialStatus` prop lets parent pass known status to skip the fetch
 */
export default function FollowButton({
  targetUserId,
  isPrivate = false,
  initialStatus = null,
  size = 'md',
  onFollowChange,
}) {
  const { user, isGuest } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus]  = useState(initialStatus ?? 'loading')
  const inflightRef          = useRef(false)

  useEffect(() => {
    if (initialStatus !== null) return
    if (!user || user.userId === targetUserId) { setStatus('none'); return }
    let cancelled = false
    followApi.isFollowing(targetUserId)
      .then(r => { if (!cancelled) setStatus(r.data.isFollowing ? 'following' : 'none') })
      .catch(() => { if (!cancelled) setStatus('none') })
    return () => { cancelled = true }
  }, [targetUserId, user, initialStatus])

  const handleClick = async () => {
    if (isGuest) { navigate('/login'); return }
    if (inflightRef.current || status === 'loading') return
    inflightRef.current = true

    const prev = status
    // Optimistic update
    if (prev === 'following' || prev === 'pending') {
      setStatus('none'); onFollowChange?.('none')
    } else {
      const next = isPrivate ? 'pending' : 'following'
      setStatus(next); onFollowChange?.(next)
    }

    try {
      if (prev === 'following' || prev === 'pending') {
        await followApi.unfollow(targetUserId)
        toast.success(prev === 'pending' ? 'Request cancelled' : 'Unfollowed')
      } else {
        const { data } = await followApi.follow(targetUserId)
        const confirmed = data.status === 'PENDING' ? 'pending' : 'following'
        setStatus(confirmed); onFollowChange?.(confirmed)
        toast.success(confirmed === 'pending' ? 'Follow request sent!' : 'Now following!')
      }
    } catch (err) {
      setStatus(prev); onFollowChange?.(prev)
      toast.error(err.response?.data?.error || 'Action failed — try again')
    } finally { inflightRef.current = false }
  }

  if (user?.userId === targetUserId) return null

  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' : 'px-4 py-2 text-sm rounded-xl'
  const variantClasses = {
    loading:   'bg-cs-muted text-cs-subtle opacity-60 cursor-wait',
    following: 'bg-cs-muted text-cs-text border border-cs-border hover:bg-cs-red/10 hover:text-cs-red hover:border-cs-red/30',
    pending:   'bg-cs-muted text-cs-subtle border border-cs-border',
    none:      'bg-cs-accent text-cs-bg hover:bg-amber-400',
  }[status] ?? 'bg-cs-accent text-cs-bg hover:bg-amber-400'

  const label = {
    loading: '...', following: 'Following', pending: 'Requested', none: isPrivate ? '🔒 Request' : 'Follow',
  }[status] ?? 'Follow'

  return (
    <button onClick={handleClick} disabled={status === 'loading' || inflightRef.current}
      className={`inline-flex items-center gap-1.5 font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 ${sizeClasses} ${variantClasses}`}>
      {status === 'loading' ? <Spinner size={12} /> : label}
    </button>
  )
}
