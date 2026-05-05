// ── Avatar ────────────────────────────────────────────────────────────────────
export default function Avatar({ src, name = '?', size = 40, className = '' }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colors = [
    'bg-amber-500', 'bg-blue-500', 'bg-green-500',
    'bg-purple-500', 'bg-pink-500', 'bg-teal-500'
  ]
  const color = colors[(name.charCodeAt(0) || 0) % colors.length]

  if (src) {
    return (
      <img src={src} alt={name} width={size} height={size}
        className={`avatar ${className}`}
        style={{ width: size, height: size, minWidth: size }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.removeAttribute('hidden') }}
      />
    )
  }

  return (
    <div className={`avatar flex items-center justify-center ${color} ${className}`}
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.38 }}>
      <span className="font-semibold text-white select-none">{initials}</span>
    </div>
  )
}
