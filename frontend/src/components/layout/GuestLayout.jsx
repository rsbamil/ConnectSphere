// ── GuestLayout — minimal wrapper for landing/public pages ───────────────────
import { Outlet, NavLink } from 'react-router-dom'

export function GuestLayoutComponent() {
  return (
    <div className="min-h-screen bg-cs-bg">
      <header className="fixed top-0 left-0 right-0 z-20 bg-cs-bg/80 backdrop-blur-md border-b border-cs-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-display font-bold text-cs-accent text-lg">ConnectSphere</span>
          <div className="flex items-center gap-3">
            <NavLink to="/login"    className="btn-ghost text-sm">Sign in</NavLink>
            <NavLink to="/register" className="btn-primary text-sm">Get started</NavLink>
          </div>
        </div>
      </header>
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  )
}

export default GuestLayoutComponent
