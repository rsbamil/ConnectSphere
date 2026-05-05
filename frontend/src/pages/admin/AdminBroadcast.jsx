import { useState, useEffect } from 'react'
import { authApi, notifApi } from '../../services/api'
import { Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function AdminBroadcast() {
  const [users, setUsers]   = useState([])
  const [title, setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]     = useState(false)

  useEffect(() => {
    authApi.getAllUsers(1, 200)
      .then(r => setUsers(r.data))
      .catch(() => {})
  }, [])

  const send = async (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setSending(true)
    try {
      await notifApi.broadcast({
        userIds: users.filter(u => u.isActive).map(u => u.userId),
        title,
        message
      })
      setSent(true)
      setTitle(''); setMessage('')
      toast.success(`Broadcast sent to ${users.filter(u => u.isActive).length} users!`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Broadcast failed')
    } finally { setSending(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-cs-text">Send Broadcast</h1>
        <p className="text-sm text-cs-subtle mt-0.5">
          Send a PLATFORM notification to all {users.filter(u => u.isActive).length} active users
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={send} className="cs-card p-6 space-y-5">
          <div>
            <label className="block text-xs text-cs-subtle mb-1.5">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Platform Update" maxLength={100}
              className="cs-input" required />
            <p className="text-xs text-cs-subtle text-right mt-1">{title.length}/100</p>
          </div>

          <div>
            <label className="block text-xs text-cs-subtle mb-1.5">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Write your announcement here..." maxLength={300} rows={5}
              className="cs-input resize-none" required />
            <p className="text-xs text-cs-subtle text-right mt-1">{message.length}/300</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-cs-subtle">
              Recipients: <span className="text-cs-text font-semibold">{users.filter(u => u.isActive).length} active users</span>
            </p>
            <button type="submit" disabled={sending} className="btn-primary">
              {sending ? <Spinner size={16} /> : '📢 Send broadcast'}
            </button>
          </div>

          {sent && (
            <div className="bg-cs-green/10 border border-cs-green/20 text-cs-green text-sm px-4 py-3 rounded-xl animate-fade-up">
              ✅ Broadcast sent successfully!
            </div>
          )}
        </form>

        {/* Preview */}
        <div>
          <p className="text-xs text-cs-subtle uppercase tracking-wider mb-3">Preview</p>
          <div className="cs-card p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📢</span>
              <div>
                <p className="font-semibold text-sm text-cs-text">{title || 'Notification title'}</p>
                <p className="text-sm text-cs-subtle mt-1 leading-relaxed">
                  {message || 'Your message will appear here...'}
                </p>
                <p className="text-xs text-cs-subtle mt-2">just now</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-cs-accent mt-1 ml-auto animate-pulse-dot" />
            </div>
          </div>

          <div className="mt-4 cs-card p-4">
            <p className="text-xs font-semibold text-cs-subtle uppercase tracking-wider mb-2">Tips</p>
            <ul className="text-xs text-cs-subtle space-y-1.5">
              <li>• Keep the title short and descriptive</li>
              <li>• Broadcast notifications appear in all users' notification centres</li>
              <li>• Only active (non-suspended) accounts receive notifications</li>
              <li>• Notifications cannot be unsent — double-check before sending</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
