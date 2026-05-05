import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { authApi, postApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/ui/Avatar'
import PostCard from '../components/posts/PostCard'
import { EmptyState, Spinner } from '../components/ui/index'

const TABS = ['People', 'Posts']

export default function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery]   = useState('')
  const [tab, setTab]       = useState('People')
  const [people, setPeople] = useState([])
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setPeople([]); setPosts([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        if (tab === 'People') {
          const { data } = await authApi.search(query)
          setPeople(data)
        } else {
          const { data } = await postApi.search(query)
          setPosts(data)
        }
      } catch {} finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, tab])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-cs-text">Search</h1>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cs-subtle" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search people or posts..."
          className="cs-input pl-10" autoFocus />
        {loading && <Spinner size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2" />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-cs-surface border border-cs-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t ? 'bg-cs-accent text-cs-bg' : 'text-cs-subtle hover:text-cs-text'}`}>
            {t}
          </button>
        ))}
      </div>

      {!query.trim() ? (
        <EmptyState icon="🔍" title="Start searching" subtitle="Enter a name, username, or keyword." />
      ) : (
        <>
          {tab === 'People' && (
            people.length === 0 && !loading
              ? <EmptyState icon="👤" title="No users found" />
              : <div className="space-y-2">
                  {people.map(u => (
                    <Link key={u.userId} to={`/profile/${u.userName}`}
                      className="cs-card flex items-center gap-4 px-4 py-3.5 hover:border-cs-muted transition-colors">
                      <Avatar src={u.avatarUrl} name={u.fullName} size={44} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-cs-text truncate">{u.fullName}</p>
                        <p className="text-xs text-cs-subtle truncate">@{u.userName}</p>
                        <p className="text-xs text-cs-subtle mt-0.5">{u.followerCount} followers</p>
                      </div>
                      {u.isPrivate && <LockIcon className="w-4 h-4 text-cs-subtle flex-shrink-0" />}
                    </Link>
                  ))}
                </div>
          )}

          {tab === 'Posts' && (
            posts.length === 0 && !loading
              ? <EmptyState icon="📝" title="No posts found" />
              : <div className="space-y-3">
                  {posts.map(p => <PostCard key={p.postId} post={p} />)}
                </div>
          )}
        </>
      )}
    </div>
  )
}

const SearchIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
const LockIcon   = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
