import { useState, useRef, useCallback } from 'react'
import { postApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../ui/Avatar'
import { Spinner } from '../ui/index'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// CreatePostForm — Instagram-style media post composer
//
// Media handling strategy:
//   Since Neon/Render have no file storage, we support two approaches:
//   1. Paste a direct image/video URL (works with any CDN, Imgur, Cloudinary etc.)
//   2. Upload a local file → converted to base64 data URL (works for small images,
//      fine for a demo; in production swap this for an Azure Blob / Cloudinary upload)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILE_MB  = 5
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

export default function CreatePostForm({ onCreated }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [content, setContent]       = useState('')
  const [hashtags, setHashtags]     = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [loading, setLoading]       = useState(false)
  const [expanded, setExpanded]     = useState(false)

  // Media state
  const [mediaPreview, setMediaPreview] = useState(null)   // base64 or URL for <img>/<video>
  const [mediaUrl, setMediaUrl]     = useState('')          // final URL sent to API
  const [mediaType, setMediaType]   = useState(null)        // IMAGE | VIDEO | GIF
  const [urlInput, setUrlInput]     = useState('')          // manual URL input
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [uploadTab, setUploadTab]   = useState('file')      // 'file' | 'url'

  // ── File pick handler ───────────────────────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      toast.error(`File too large — max ${MAX_FILE_MB}MB`)
      return
    }

    const isVideo = file.type.startsWith('video/')
    const isGif   = file.type === 'image/gif'
    const isImage = file.type.startsWith('image/')

    if (!isVideo && !isImage) {
      toast.error('Only images and videos are supported')
      return
    }

    setMediaType(isVideo ? 'VIDEO' : isGif ? 'GIF' : 'IMAGE')

    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target.result
      setMediaPreview(dataUrl)
      setMediaUrl(dataUrl)      // base64 data URL — backend stores it as-is
    }
    reader.readAsDataURL(file)
    setExpanded(true)
  }, [])

  // ── URL paste handler ───────────────────────────────────────────────────────
  const applyUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    const isVideo = /\.(mp4|webm|mov|avi)(\?|$)/i.test(url)
    const isGif   = /\.gif(\?|$)/i.test(url)
    setMediaType(isVideo ? 'VIDEO' : isGif ? 'GIF' : 'IMAGE')
    setMediaPreview(url)
    setMediaUrl(url)
    setShowUrlInput(false)
    setUrlInput('')
    setExpanded(true)
    toast.success('Media added!')
  }

  const clearMedia = () => {
    setMediaPreview(null)
    setMediaUrl('')
    setMediaType(null)
    setUrlInput('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !mediaUrl) return
    setLoading(true)
    try {
      const { data } = await postApi.create({
        content: content.trim() || '📷',
        hashtags: hashtags || undefined,
        visibility,
        mediaUrl:  mediaUrl  || undefined,
        mediaType: mediaType || undefined,
      })
      toast.success('Post shared!')
      // Reset all state
      setContent(''); setHashtags(''); setVisibility('PUBLIC')
      clearMedia(); setExpanded(false)
      onCreated?.(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create post')
    } finally { setLoading(false) }
  }

  const canSubmit = (content.trim() || mediaUrl) && !loading && content.length <= 2000

  return (
    <div className="cs-card mb-4 overflow-hidden">
      {/* Top row */}
      <div className="flex gap-3 p-5">
        <Avatar src={user?.avatarUrl} name={user?.fullName} size={40} />
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); if (!expanded) setExpanded(true) }}
            onFocus={() => setExpanded(true)}
            placeholder="What's on your mind?"
            rows={expanded ? 3 : 1}
            className="w-full bg-transparent text-cs-text text-sm placeholder-cs-subtle resize-none focus:outline-none transition-all duration-200"
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative mt-3 rounded-xl overflow-hidden bg-cs-muted group">
              {mediaType === 'VIDEO'
                ? <video src={mediaPreview} controls className="w-full max-h-72 object-contain" />
                : <img src={mediaPreview} alt="preview" className="w-full max-h-72 object-cover" />
              }
              <button onClick={clearMedia}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors opacity-0 group-hover:opacity-100">
                <XIcon className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-2 left-2">
                <span className="badge bg-black/60 text-white text-xs">{mediaType}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* URL input panel */}
      {showUrlInput && (
        <div className="px-5 pb-4 border-t border-cs-border pt-4 animate-fade-up">
          <p className="text-xs text-cs-subtle mb-2">Paste a direct image or video URL</p>
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyUrl()}
              placeholder="https://example.com/image.jpg"
              className="cs-input text-sm flex-1"
              autoFocus
            />
            <button onClick={applyUrl} className="btn-primary text-xs px-3 py-2">Add</button>
            <button onClick={() => setShowUrlInput(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      {expanded && (
        <div className="border-t border-cs-border px-5 py-3 animate-fade-up">
          {/* Media action buttons */}
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-cs-subtle mr-2 font-medium">Add media:</span>

            {/* File upload */}
            <button onClick={() => fileInputRef.current?.click()}
              title="Upload photo or video"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cs-subtle hover:text-cs-blue hover:bg-cs-blue/10 transition-all">
              <PhotoIcon className="w-4 h-4" />
              Photo / Video
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* URL */}
            <button onClick={() => setShowUrlInput(v => !v)}
              title="Add media via URL"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cs-subtle hover:text-cs-accent hover:bg-cs-accent/10 transition-all">
              <LinkIcon className="w-4 h-4" />
              URL
            </button>

            {mediaPreview && (
              <button onClick={clearMedia}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cs-red hover:bg-cs-red/10 transition-all ml-auto">
                <XIcon className="w-3.5 h-3.5" />
                Remove media
              </button>
            )}
          </div>

          {/* Hashtags */}
          <input
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            placeholder="#travel, #food, #tech"
            className="cs-input text-xs py-2 mb-3"
          />

          {/* Visibility + Submit */}
          <div className="flex items-center justify-between gap-3">
            <select value={visibility} onChange={e => setVisibility(e.target.value)}
              className="bg-cs-muted border border-cs-border text-cs-text text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cs-accent cursor-pointer">
              <option value="PUBLIC">🌍 Public</option>
              <option value="FOLLOWERS">👥 Followers only</option>
              <option value="PRIVATE">🔒 Only me</option>
            </select>

            <div className="flex items-center gap-3">
              <span className={`text-xs ${content.length > 1900 ? 'text-cs-red' : 'text-cs-subtle'}`}>
                {content.length}/2000
              </span>
              <button onClick={() => { setExpanded(false); clearMedia(); setContent(''); setHashtags('') }}
                className="btn-ghost text-xs">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit}
                className="btn-primary text-xs px-5 py-2">
                {loading ? <Spinner size={14} /> : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const PhotoIcon = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
const LinkIcon  = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
const XIcon     = ({className}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
