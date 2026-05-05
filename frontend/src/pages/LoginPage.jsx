import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/ui/index'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'

// ── Shared auth card wrapper ───────────────────────────────────────────────────
function AuthCard({ children }) {
  return (
    <div className="min-h-screen bg-cs-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cs-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cs-blue/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-cs-accent tracking-tight">ConnectSphere</h1>
          <p className="text-sm text-cs-subtle mt-1">Share. Connect. Discover. Your World.</p>
        </div>
        <div className="cs-card p-8">{children}</div>
      </div>
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ userNameOrEmail: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  const handleGoogleSuccess = async (response) => {
    setLoading(true)
    try {
      await googleLogin(response.credential)
      toast.success('Welcome to ConnectSphere!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <h2 className="font-display font-semibold text-xl text-cs-text mb-6">Sign in</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-cs-subtle mb-1.5">Username or email</label>
          <input name="userNameOrEmail" value={form.userNameOrEmail} onChange={handleChange}
            className="cs-input" autoFocus required placeholder="@username or email" />
        </div>
        <div>
          <label className="block text-xs text-cs-subtle mb-1.5">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange}
            className="cs-input" required placeholder="••••••••" />
        </div>

        {error && (
          <div className="bg-cs-red/10 border border-cs-red/20 text-cs-red text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
          {loading ? <Spinner size={18} /> : 'Sign in'}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cs-border"></div></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-cs-bg px-2 text-cs-subtle">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google Login failed')}
          useOneTap
          theme="filled_black"
          shape="pill"
          width="100%"
        />
      </div>

      <p className="text-sm text-cs-subtle text-center mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-cs-accent hover:text-amber-300 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </AuthCard>
  )
}

export default LoginPage
