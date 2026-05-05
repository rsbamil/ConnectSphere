import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// ─────────────────────────────────────────────────────────────────────────────
// Role system:
//   GUEST = no token (user === null) — read-only public access
//   USER  = logged in, isAdmin = false — full social features
//   ADMIN = logged in, isAdmin = true  — all features + /admin panel
//
// Admin is set in the database (isAdmin = true on User entity).
// JWT carries Role = "Admin" claim which backend enforces.
// Frontend reads user.isAdmin from the decoded JWT / stored user object.
// ─────────────────────────────────────────────────────────────────────────────

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // Keep a ref so callbacks always see the latest user without stale closures
  const userRef = useRef(null)
  useEffect(() => { userRef.current = user }, [user])

  // ── Hydrate from localStorage on mount ─────────────────────────────────────
  useEffect(() => {
    const doHydrate = () => {
      const token    = localStorage.getItem('cs_token')
      const userData = localStorage.getItem('cs_user')

      if (!token || !userData) { setLoading(false); return }

      try {
        const claims = parseJwt(token)
        // Expired?
        if (claims?.exp && claims.exp * 1000 < Date.now()) {
          localStorage.removeItem('cs_token')
          localStorage.removeItem('cs_user')
          setLoading(false)
          return
        }
        const parsed = JSON.parse(userData)
        setUser(parsed)
      } catch {
        localStorage.removeItem('cs_token')
        localStorage.removeItem('cs_user')
      }
      setLoading(false)
    }
    doHydrate()
  }, []) // run once on mount

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    localStorage.setItem('cs_token', data.token)
    localStorage.setItem('cs_user',  JSON.stringify(data.user))
    setUser(data.user)
    userRef.current = data.user
    return data.user
  }, [])

  // ── Google Login ──────────────────────────────────────────────────────────
  const googleLogin = useCallback(async (idToken) => {
    const { data } = await authApi.googleLogin(idToken)
    localStorage.setItem('cs_token', data.token)
    localStorage.setItem('cs_user',  JSON.stringify(data.user))
    setUser(data.user)
    userRef.current = data.user
    return data.user
  }, [])

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (info) => {
    const { data } = await authApi.register(info)
    localStorage.setItem('cs_token', data.token)
    localStorage.setItem('cs_user',  JSON.stringify(data.user))
    setUser(data.user)
    userRef.current = data.user
    return data.user
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('cs_token')
    localStorage.removeItem('cs_user')
    setUser(null)
    userRef.current = null
  }, [])

  // ── Refresh user from server ───────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const current = userRef.current
    if (!current) return
    try {
      const { data } = await authApi.getById(current.userId)
      const updated  = { ...current, ...data }
      localStorage.setItem('cs_user', JSON.stringify(updated))
      setUser(updated)
      userRef.current = updated
    } catch {
      toast.error('Could not refresh profile')
    }
  }, [])

  const isGuest = !user
  const isAdmin = user?.isAdmin === true
  const isUser  = !!user && !isAdmin

  return (
    <AuthContext.Provider value={{
      user, userRef, loading,
      login, register, logout, refreshUser, googleLogin,
      isGuest, isAdmin, isUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
