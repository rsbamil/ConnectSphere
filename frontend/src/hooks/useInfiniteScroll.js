import { useEffect, useRef, useCallback } from 'react'

/**
 * Fires `onLoadMore` when the sentinel element scrolls into view.
 * Usage:
 *   const sentinelRef = useInfiniteScroll(loadMoreFn, hasMore)
 *   <div ref={sentinelRef} />
 */
export default function useInfiniteScroll(onLoadMore, hasMore) {
  const observer = useRef(null)
  const sentinelRef = useCallback(node => {
    if (observer.current) observer.current.disconnect()
    if (!node || !hasMore) return
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) onLoadMore()
    }, { rootMargin: '200px' })
    observer.current.observe(node)
  }, [onLoadMore, hasMore])

  return sentinelRef
}
