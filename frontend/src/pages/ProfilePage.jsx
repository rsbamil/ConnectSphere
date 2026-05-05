import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { authApi, postApi, followApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/posts/PostCard'
import Avatar from '../components/ui/Avatar'
import FollowButton from '../components/ui/FollowButton'
import { EmptyState, PostSkeleton, ProfileSkeleton, Modal } from '../components/ui/index'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// ProfilePage
//
// FIX: Fetch follower/following/post counts directly from Follow and Post
// services instead of using denormalized counters on the User entity
// (those counters are updated via service-to-service HTTP which may fail).
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { username }   = useParams()
  const { user: me, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile]       = useState(null)
  const [posts, setPosts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)

  // Real counts fetched from service (not from denormalized User entity)
  const [realCounts, setRealCounts] = useState({ posts: 0, followers: 0, following: 0 })

  const [initialFollowStatus, setInitialFollowStatus] = useState(null)
  const [showConnections, setShowConnections] = useState(false)
  const [followers, setFollowers]   = useState([])
  const [following, setFollowing]   = useState([])
  const [connectTab, setConnectTab] = useState('followers')
  const [connectLoading, setConnectLoading] = useState(false)

  const isOwnProfile = me?.userName?.toLowerCase() === username?.toLowerCase()

  useEffect(() => {
    setLoading(true)
    setInitialFollowStatus(null)
    setRealCounts({ posts: 0, followers: 0, following: 0 })

    const request = /^\d+$/.test(username)
      ? authApi.getById(username)
      : authApi.getByUsername(username)
      .then(async r => {
        const prof = r.data
        setProfile(prof)

        // ── Fetch all counts in parallel directly from services ─────────────
        const [postsRes, followersRes, followingRes, followStatusRes] = await Promise.allSettled([
          postApi.byUser(prof.userId, 1),
          followApi.followers(prof.userId),
          followApi.following(prof.userId),
          // Check if ME is following this user
          (me && !isOwnProfile) ? followApi.isFollowing(prof.userId) : Promise.resolve(null),
        ])

        // Real post count
        const postsData = postsRes.status === 'fulfilled' ? postsRes.value.data : []
        const followerList = followersRes.status === 'fulfilled' ? followersRes.value.data : []
        const followingList = followingRes.status === 'fulfilled' ? followingRes.value.data : []

        setRealCounts({
          posts:     postsData.length,
          followers: followerList.length,
          following: followingList.length,
        })

        // Set posts
        setPostsLoading(true)
        setPosts(postsData)
        setPostsLoading(false)

        // Set follow status
        if (followStatusRes.status === 'fulfilled' && followStatusRes.value) {
          setInitialFollowStatus(followStatusRes.value.data.isFollowing ? 'following' : 'none')
        } else if (isOwnProfile) {
          setInitialFollowStatus(null)
        } else {
          setInitialFollowStatus('none')
        }
      })
      .catch(() => { toast.error('User not found'); navigate('/') })
      .finally(() => setLoading(false))
  }, [username, me?.userId, isOwnProfile])

  // ── Follow change: update counts live ──────────────────────────────────────
  const handleFollowChange = (newStatus) => {
    setRealCounts(c => ({
      ...c,
      followers: newStatus === 'following'
        ? c.followers + 1
        : Math.max(0, c.followers - 1),
    }))
  }

  // ── Open followers/following modal ─────────────────────────────────────────
  const openConnections = async (tab) => {
    setConnectTab(tab)
    setShowConnections(true)
    setConnectLoading(true)
    try {
      const [frs, fing] = await Promise.all([
        followApi.followers(profile.userId),
        followApi.following(profile.userId),
      ])

      // Enrich with real user profiles
      const enrich = async (list, getUid) =>
        Promise.all(list.map(async f => {
          try {
            const { data } = await authApi.getById(getUid(f))
            return { ...f, _user: data }
          } catch { return f }
        }))

      const [richFollowers, richFollowing] = await Promise.all([
        enrich(frs.data, f => f.followerId),
        enrich(fing.data, f => f.followeeId),
      ])
      setFollowers(richFollowers)
      setFollowing(richFollowing)
    } catch {
      toast.error('Could not load connections')
    } finally {
      setConnectLoading(false)
    }
  }

  const suspendUser = async () => {
    if (!window.confirm(`Suspend @${profile.userName}?`)) return
    try {
      await authApi.suspend(profile.userId)
      setProfile(p => ({ ...p, isActive: false }))
      toast.success('User suspended')
    } catch { toast.error('Failed') }
  }

  if (loading) return <ProfileSkeleton />
  if (!profile) return null

  return (
    <div>
      {/* ── Profile card ── */}
      <div className="cs-card p-6 mb-4 animate-fade-up">
        <div className="flex items-start justify-between mb-4">
          <Avatar src={profile.avatarUrl} name={profile.fullName} size={72} />
          <div className="flex gap-2 flex-wrap justify-end">
            {isOwnProfile ? (
              <Link to="/settings" className="btn-ghost text-sm">Edit profile</Link>
            ) : (
              initialFollowStatus !== null && (
                <FollowButton
                  targetUserId={profile.userId}
                  isPrivate={profile.isPrivate}
                  initialStatus={initialFollowStatus}
                  onFollowChange={handleFollowChange}
                />
              )
            )}
            {isAdmin && !isOwnProfile && (
              <button onClick={suspendUser}
                className={`text-sm px-4 py-2 rounded-xl font-medium transition-all
                  ${profile.isActive ? 'btn-danger' : 'bg-cs-muted text-cs-subtle'}`}>
                {profile.isActive ? 'Suspend' : 'Suspended'}
              </button>
            )}
          </div>
        </div>

        {/* Name & bio */}
        <h1 className="font-display font-bold text-xl text-cs-text">{profile.fullName}</h1>
        <p className="text-sm text-cs-subtle mb-2">@{profile.userName}</p>
        {profile.bio && (
          <p className="text-sm text-cs-text mb-4 leading-relaxed">{profile.bio}</p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {profile.isAdmin   && <span className="badge-purple">🛡️ Admin</span>}
          {profile.isPrivate && <span className="badge-blue">🔒 Private</span>}
          {!profile.isActive && <span className="badge-red">Suspended</span>}
        </div>

        {/* ── Stats — sourced from services, not DB counters ── */}
        <div className="flex gap-8">
          <div className="text-center">
            <p className="font-bold text-cs-text text-xl">{realCounts.posts}</p>
            <p className="text-xs text-cs-subtle mt-0.5">Posts</p>
          </div>
          <button
            onClick={() => openConnections('followers')}
            className="text-center hover:opacity-80 transition-opacity cursor-pointer">
            <p className="font-bold text-cs-text text-xl">{realCounts.followers}</p>
            <p className="text-xs text-cs-subtle mt-0.5">Followers</p>
          </button>
          <button
            onClick={() => openConnections('following')}
            className="text-center hover:opacity-80 transition-opacity cursor-pointer">
            <p className="font-bold text-cs-text text-xl">{realCounts.following}</p>
            <p className="text-xs text-cs-subtle mt-0.5">Following</p>
          </button>
        </div>
      </div>

      {/* ── Posts ── */}
      <div>
        <h2 className="font-semibold text-xs text-cs-subtle uppercase tracking-wider mb-3 px-1">
          Posts
        </h2>
        {postsLoading
          ? [...Array(2)].map((_, i) => <PostSkeleton key={i} />)
          : posts.length === 0
            ? <EmptyState icon="📝" title="No posts yet"
                subtitle={isOwnProfile ? 'Share something with your followers!' : undefined} />
            : <div className="space-y-3">
                {posts.map(p => (
                  <PostCard key={p.postId} post={p}
                    onDelete={id => {
                      setPosts(ps => ps.filter(x => x.postId !== id))
                      setRealCounts(c => ({ ...c, posts: Math.max(0, c.posts - 1) }))
                    }}
                  />
                ))}
              </div>
        }
      </div>

      {/* ── Followers / Following modal ── */}
      <Modal open={showConnections} onClose={() => setShowConnections(false)} title="Connections">
        {/* Tab switch */}
        <div className="flex gap-1 mb-4 bg-cs-muted rounded-xl p-1">
          {['followers', 'following'].map(t => (
            <button key={t} onClick={() => setConnectTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize
                ${connectTab === t ? 'bg-cs-surface text-cs-text shadow-sm' : 'text-cs-subtle hover:text-cs-text'}`}>
              {t === 'followers' ? `Followers (${realCounts.followers})` : `Following (${realCounts.following})`}
            </button>
          ))}
        </div>

        {connectLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 rounded-full border-2 border-cs-border border-t-cs-accent animate-spin" />
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {(connectTab === 'followers' ? followers : following).map(f => {
              const uid = connectTab === 'followers' ? f.followerId : f.followeeId
              const u   = f._user
              return (
                <div key={f.followId} className="flex items-center justify-between gap-3">
                  <Link
                    to={`/profile/${u?.userName || uid}`}
                    onClick={() => setShowConnections(false)}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                    <Avatar src={u?.avatarUrl} name={u?.fullName || `User ${uid}`} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cs-text truncate">
                        {u?.fullName || `User #${uid}`}
                      </p>
                      <p className="text-xs text-cs-subtle">@{u?.userName || uid}</p>
                    </div>
                  </Link>
                  {me && me.userId !== uid && (
                    <FollowButton targetUserId={uid} isPrivate={u?.isPrivate} size="sm" />
                  )}
                </div>
              )
            })}
            {(connectTab === 'followers' ? followers : following).length === 0 && (
              <p className="text-sm text-cs-subtle text-center py-6">
                {connectTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
