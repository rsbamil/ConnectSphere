// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, className = '' }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-cs-border border-t-cs-accent ${className}`}
      style={{ width: size, height: size }} />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size={36} />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {icon && <div className="text-4xl mb-4 opacity-50">{icon}</div>}
      <h3 className="text-base font-semibold text-cs-text mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-cs-subtle max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} cs-card p-6 animate-fade-up`}>
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-cs-text">{title}</h2>
            <button onClick={onClose} className="text-cs-subtle hover:text-cs-text transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function PostSkeleton() {
  return (
    <div className="cs-card p-5 space-y-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-3 w-3/5 rounded" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="cs-card p-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <div className="skeleton w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="skeleton h-3 w-full rounded mb-2" />
      <div className="skeleton h-3 w-3/4 rounded" />
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
export const XIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
