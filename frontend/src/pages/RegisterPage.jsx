import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/ui/index'
import toast from 'react-hot-toast'

function AuthCard({ children }) {
  return (
    <div className="min-h-screen bg-cs-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cs-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-cs-purple/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-cs-accent tracking-tight">ConnectSphere</h1>
          <p className="text-sm text-cs-subtle mt-1">Join the community today</p>
        </div>
        <div className="cs-card p-8">{children}</div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ userName: '', fullName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(form)
      toast.success('Welcome to ConnectSphere!')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try a different username.')
    } finally { setLoading(false) }
  }

  return (
    <AuthCard>
      <h2 className="font-display font-semibold text-xl text-cs-text mb-6">Create account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-cs-subtle mb-1.5">Username</label>
            <input name="userName" value={form.userName} onChange={handleChange}
              className="cs-input" required placeholder="alice" minLength={3} maxLength={50} />
          </div>
          <div>
            <label className="block text-xs text-cs-subtle mb-1.5">Full name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange}
              className="cs-input" required placeholder="Alice Smith" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-cs-subtle mb-1.5">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            className="cs-input" required placeholder="alice@example.com" />
        </div>
        <div>
          <label className="block text-xs text-cs-subtle mb-1.5">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange}
            className="cs-input" required minLength={6} placeholder="Min. 6 characters" />
        </div>

        {error && (
          <div className="bg-cs-red/10 border border-cs-red/20 text-cs-red text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
          {loading ? <Spinner size={18} /> : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-cs-subtle text-center mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-cs-accent hover:text-amber-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
