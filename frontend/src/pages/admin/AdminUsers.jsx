import { useState, useEffect } from 'react'
import { authApi } from '../../services/api'
import Avatar from '../../components/ui/Avatar'
import { PageSpinner, EmptyState, Modal, Spinner } from '../../components/ui/index'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filtered, setFiltered] = useState([])
  const [actionLoading, setActionLoading] = useState({}) // { [userId]: true }
  // Make-admin confirmation modal
  const [adminModal, setAdminModal] = useState(null)  // user object or null

  useEffect(() => {
    authApi.getAllUsers(1)
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Could not load users'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(q
      ? users.filter(u =>
          u.userName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q))
      : users)
  }, [search, users])

  const setLoading2 = (uid, val) =>
    setActionLoading(prev => ({ ...prev, [uid]: val }))

  // ── Suspend / Unsuspend ─────────────────────────────────────────────────────
  const toggleSuspend = async (u) => {
    if (!window.confirm(u.isActive
      ? `Suspend @${u.userName}? They won't be able to log in.`
      : `Unsuspend @${u.userName}?`)) return
    setLoading2(u.userId, true)
    try {
      if (u.isActive) {
        await authApi.suspend(u.userId)
        setUsers(us => us.map(x => x.userId === u.userId ? { ...x, isActive: false } : x))
        toast.success(`@${u.userName} suspended`)
      } else {
        await authApi.unsuspend(u.userId)
        setUsers(us => us.map(x => x.userId === u.userId ? { ...x, isActive: true } : x))
        toast.success(`@${u.userName} unsuspended`)
      }
    } catch { toast.error('Action failed') }
    finally { setLoading2(u.userId, false) }
  }

  // ── Grant / Revoke Admin ────────────────────────────────────────────────────
  // Opens confirmation modal — admin changes are irreversible-ish and powerful
  const openAdminModal = (u) => setAdminModal(u)

  const confirmAdminChange = async () => {
    const u = adminModal
    setAdminModal(null)
    setLoading2(u.userId, true)
    try {
      const newVal = !u.isAdmin
      await authApi.setAdminRole(u.userId, newVal)
      setUsers(us => us.map(x => x.userId === u.userId ? { ...x, isAdmin: newVal } : x))
      toast.success(newVal
        ? `@${u.userName} is now an admin`
        : `@${u.userName} admin role removed`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update admin role')
    } finally { setLoading2(u.userId, false) }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteUser = async (u) => {
    if (!window.confirm(`Permanently delete @${u.userName}?\n\nThis CANNOT be undone.`)) return
    setLoading2(u.userId, true)
    try {
      await authApi.deleteUser(u.userId)
      setUsers(us => us.filter(x => x.userId !== u.userId))
      toast.success(`@${u.userName} deleted`)
    } catch { toast.error('Failed to delete') }
    finally { setLoading2(u.userId, false) }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-cs-text">Users</h1>
          <p className="text-sm text-cs-subtle mt-0.5">
            {users.length} total · {users.filter(u => u.isAdmin).length} admins · {users.filter(u => !u.isActive).length} suspended
          </p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, username, email…"
          className="cs-input w-64 text-sm" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        <span className="badge-green">Active</span>
        <span className="badge-red">Suspended</span>
        <span className="badge-purple">Admin</span>
        <p className="text-xs text-cs-subtle self-center">
          Grant / revoke admin role using the shield button in the Actions column.
        </p>
      </div>

      {filtered.length === 0
        ? <EmptyState icon="👤" title="No users found" />
        : (
          <div className="cs-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-cs-border bg-cs-muted/30">
                  {['User', 'Email', 'Joined', 'Status', 'Role', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-cs-subtle uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cs-border">
                {filtered.map(u => (
                  <tr key={u.userId} className="hover:bg-cs-muted/40 transition-colors">

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatarUrl} name={u.fullName} size={34} />
                        <div>
                          <p className="font-medium text-cs-text">{u.fullName}</p>
                          <p className="text-xs text-cs-subtle">@{u.userName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-cs-subtle text-xs">{u.email}</td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-cs-subtle text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={u.isAdmin ? 'badge-purple' : 'badge text-cs-subtle bg-cs-muted'}>
                        {u.isAdmin ? '🛡️ Admin' : 'User'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {actionLoading[u.userId]
                          ? <Spinner size={16} />
                          : (
                            <>
                              {/* Suspend / Unsuspend */}
                              <button onClick={() => toggleSuspend(u)}
                                title={u.isActive ? 'Suspend account' : 'Unsuspend account'}
                                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all
                                  ${u.isActive
                                    ? 'bg-cs-accent/10 text-cs-accent hover:bg-cs-accent/20'
                                    : 'bg-cs-green/10 text-cs-green hover:bg-cs-green/20'}`}>
                                {u.isActive ? 'Suspend' : 'Unsuspend'}
                              </button>

                              {/* Grant / Revoke Admin */}
                              <button onClick={() => openAdminModal(u)}
                                title={u.isAdmin ? 'Revoke admin role' : 'Grant admin role'}
                                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all
                                  ${u.isAdmin
                                    ? 'bg-cs-purple/10 text-cs-purple hover:bg-cs-red/10 hover:text-cs-red'
                                    : 'bg-cs-muted text-cs-subtle hover:bg-cs-purple/10 hover:text-cs-purple'}`}>
                                {u.isAdmin ? '🛡️ Revoke Admin' : '+ Make Admin'}
                              </button>

                              {/* Delete — only non-admins */}
                              {!u.isAdmin && (
                                <button onClick={() => deleteUser(u)}
                                  title="Delete account permanently"
                                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-cs-red/10 text-cs-red hover:bg-cs-red/20 transition-all">
                                  Delete
                                </button>
                              )}
                            </>
                          )
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {/* ── Admin confirmation modal ── */}
      <Modal open={!!adminModal} onClose={() => setAdminModal(null)}
        title={adminModal?.isAdmin ? 'Revoke Admin Role' : 'Grant Admin Role'}>
        {adminModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-cs-muted rounded-xl">
              <Avatar src={adminModal.avatarUrl} name={adminModal.fullName} size={44} />
              <div>
                <p className="font-semibold text-cs-text">{adminModal.fullName}</p>
                <p className="text-sm text-cs-subtle">@{adminModal.userName}</p>
              </div>
            </div>

            {adminModal.isAdmin ? (
              <div className="bg-cs-red/10 border border-cs-red/20 rounded-xl p-4">
                <p className="text-sm text-cs-text font-medium mb-1">Remove admin access?</p>
                <p className="text-xs text-cs-subtle">
                  @{adminModal.userName} will lose access to the admin panel, user management,
                  and broadcast notifications. They will continue to have a normal user account.
                </p>
              </div>
            ) : (
              <div className="bg-cs-purple/10 border border-cs-purple/20 rounded-xl p-4">
                <p className="text-sm text-cs-text font-medium mb-1">Grant full admin access?</p>
                <p className="text-xs text-cs-subtle">
                  @{adminModal.userName} will be able to manage all users, delete any post,
                  and send platform-wide notifications. Only do this for trusted team members.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setAdminModal(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={confirmAdminChange}
                className={adminModal.isAdmin ? 'btn-danger' : 'btn-primary'}>
                {adminModal.isAdmin ? 'Yes, revoke admin' : 'Yes, grant admin'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
