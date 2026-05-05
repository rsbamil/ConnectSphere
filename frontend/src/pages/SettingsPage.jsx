import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'
import Avatar from '../components/ui/Avatar'
import { Spinner } from '../components/ui/index'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const [tab, setTab] = useState('profile')

  // Profile form
  const [fullName, setFullName]   = useState(user?.fullName || '')
  const [bio, setBio]             = useState(user?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [saving, setSaving]       = useState(false)

  // Password form
  const [curPass, setCurPass]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [passLoading, setPassLoading] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateProfile(user.userId, { fullName, bio, avatarUrl })
      await refreshUser()
      toast.success('Profile updated!')
    } catch { toast.error('Could not update profile') }
    finally { setSaving(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPassLoading(true)
    try {
      await authApi.changePassword(user.userId, { currentPassword: curPass, newPassword: newPass })
      toast.success('Password changed! Please log in again.')
      logout()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Incorrect current password')
    } finally { setPassLoading(false) }
  }

  const togglePrivacy = async () => {
    try {
      const { data } = await authApi.togglePrivacy(user.userId)
      await refreshUser()
      toast.success(data.isPrivate ? 'Account set to private' : 'Account set to public')
    } catch { toast.error('Failed to update privacy') }
  }

  const TABS = ['profile', 'password', 'privacy']

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-cs-text">Settings</h1>
      </div>

      {/* Tab pills */}
      <div className="flex gap-1 mb-6 bg-cs-surface border border-cs-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${tab === t ? 'bg-cs-accent text-cs-bg' : 'text-cs-subtle hover:text-cs-text'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="cs-card p-6 space-y-5">
          <div className="flex items-center gap-4 mb-2">
            <Avatar src={avatarUrl || user?.avatarUrl} name={fullName || user?.fullName} size={64} />
            <div className="flex-1">
              <label className="block text-xs text-cs-subtle mb-1">Avatar URL</label>
              <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://..." className="cs-input text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-cs-subtle mb-1.5">Full name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className="cs-input" required />
          </div>

          <div>
            <label className="block text-xs text-cs-subtle mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              rows={3} maxLength={500}
              placeholder="Tell people about yourself..."
              className="cs-input resize-none" />
            <p className="text-xs text-cs-subtle mt-1 text-right">{bio.length}/500</p>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Spinner size={16} /> : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Password tab ── */}
      {tab === 'password' && (
        <form onSubmit={changePassword} className="cs-card p-6 space-y-5">
          <div>
            <label className="block text-xs text-cs-subtle mb-1.5">Current password</label>
            <input type="password" value={curPass} onChange={e => setCurPass(e.target.value)}
              className="cs-input" required />
          </div>
          <div>
            <label className="block text-xs text-cs-subtle mb-1.5">New password</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
              className="cs-input" required minLength={6} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passLoading} className="btn-primary">
              {passLoading ? <Spinner size={16} /> : 'Change password'}
            </button>
          </div>
        </form>
      )}

      {/* ── Privacy tab ── */}
      {tab === 'privacy' && (
        <div className="cs-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-cs-text mb-1">Private account</h3>
              <p className="text-sm text-cs-subtle leading-relaxed">
                When your account is private, only approved followers can see your posts.
                New follow requests require your approval before they can see your content.
              </p>
            </div>
            <button onClick={togglePrivacy}
              className={`relative inline-flex w-12 h-6 rounded-full flex-shrink-0 transition-colors duration-200
                ${user?.isPrivate ? 'bg-cs-accent' : 'bg-cs-muted'}`}>
              <span className={`inline-block w-5 h-5 mt-0.5 rounded-full bg-white shadow transition-transform duration-200
                ${user?.isPrivate ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-cs-border">
            <h3 className="font-semibold text-cs-text mb-1 text-cs-red">Danger zone</h3>
            <p className="text-sm text-cs-subtle mb-3">This will permanently delete your account and all your posts.</p>
            <button className="btn-danger text-sm">Delete account</button>
          </div>
        </div>
      )}
    </div>
  )
}
