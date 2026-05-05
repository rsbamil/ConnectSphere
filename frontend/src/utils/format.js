import { formatDistanceToNow, format } from 'date-fns'

/**
 * "5 minutes ago", "2 hours ago", etc.
 */
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

/**
 * "Jan 12, 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return format(new Date(dateStr), 'MMM d, yyyy')
  } catch {
    return ''
  }
}

/**
 * Compact number: 1200 → "1.2K", 1500000 → "1.5M"
 */
export function compactNum(n) {
  if (!n && n !== 0) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/**
 * Truncate text to maxLen chars with ellipsis
 */
export function truncate(str, maxLen = 120) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

/**
 * Extract hashtags from a comma-separated string
 */
export function parseHashtags(raw) {
  if (!raw) return []
  return raw
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => (t.startsWith('#') ? t : `#${t}`))
}
