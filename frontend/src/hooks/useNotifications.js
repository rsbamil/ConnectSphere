import { useState, useEffect } from 'react'
import { notifApi } from '../services/api'

/**
 * Returns unread notification count for the logged-in user.
 * Polls every 30 seconds. Returns 0 if user is not set.
 */
export default function useNotifications(userId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    const fetch = () => {
      notifApi.unreadCount(userId)
        .then(r => setCount(r.data.count))
        .catch(() => {})
    }
    fetch()
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [userId])

  return count
}
