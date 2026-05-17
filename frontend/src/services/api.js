import axios from 'axios'
import { toast } from 'react-hot-toast'

let isWakingUpToastShown = false;

// ── Axios instances — one per microservice ────────────────────────────────────
// Local dev: Vite proxy in vite.config.js routes /api/* to correct port
// Production: set VITE_* env vars to Render service URLs

const BASE_URLS = {
  auth:    import.meta.env.VITE_AUTH_URL    || '',
  post:    import.meta.env.VITE_POST_URL    || '',
  like:    import.meta.env.VITE_LIKE_URL    || '',
  comment: import.meta.env.VITE_COMMENT_URL || '',
  follow:  import.meta.env.VITE_FOLLOW_URL  || '',
  notif:   import.meta.env.VITE_NOTIF_URL   || '',
  feed:    import.meta.env.VITE_FEED_URL    || '',
}

// ── CRITICAL FIX: Only redirect to /login on 401 from the AUTH service.
// Other services (Like, Comment, etc.) also return 401 for service-to-service
// calls — we must NOT redirect to login when those fail.
function makeClient(baseURL, { redirectOn401 = false } = {}) {
  const client = axios.create({ baseURL })

  client.interceptors.request.use(cfg => {
    const token = localStorage.getItem('cs_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
  })

  client.interceptors.response.use(
    r => r,
    async err => {
      const config = err.config;
      
      if (config) {
        config.__retryCount = config.__retryCount || 0;
        const maxRetries = 5;

        // Render cold starts often result in Network Errors (timeout/no response) or 502/503/504
        const isRetryableError =
          !err.response ||
          err.response.status === 502 ||
          err.response.status === 503 ||
          err.response.status === 504;

        if (isRetryableError && config.__retryCount < maxRetries) {
          config.__retryCount += 1;
          
          if (!isWakingUpToastShown) {
            isWakingUpToastShown = true;
            toast('Waking up services... this may take a minute ⏳', {
              duration: 8000,
              style: { background: '#333', color: '#fff', borderRadius: '8px' }
            });
            // Allow the toast to be shown again after 20 seconds
            setTimeout(() => { isWakingUpToastShown = false; }, 20000);
          }

          // Exponential backoff: 2s, 4s, 8s, 16s, 32s (total ~62 seconds wait time)
          const backoff = Math.pow(2, config.__retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoff));
          
          return client(config);
        }
      }

      if (redirectOn401 && err.response?.status === 401) {
        localStorage.removeItem('cs_token')
        localStorage.removeItem('cs_user')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )
  return client
}

// Auth service redirects on 401 (token expired / invalid)
// All other services do NOT redirect — they just fail gracefully
const authClient    = makeClient(BASE_URLS.auth,    { redirectOn401: true })
const postClient    = makeClient(BASE_URLS.post)
const likeClient    = makeClient(BASE_URLS.like)
const commentClient = makeClient(BASE_URLS.comment)
const followClient  = makeClient(BASE_URLS.follow)
const notifClient   = makeClient(BASE_URLS.notif)
const feedClient    = makeClient(BASE_URLS.feed)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register:       data => authClient.post('/api/users/register', data),
  login:          data => authClient.post('/api/users/login', data),
  googleLogin:    idToken => authClient.post('/api/users/google-login', { idToken }),
  getById:        id   => authClient.get(`/api/users/${id}`),
  getByUsername:  name => authClient.get(`/api/users/by-username/${name}`),
  search:        (q, page=1) => authClient.get('/api/users/search', { params: { q, page } }),
  updateProfile: (id, data)  => authClient.put(`/api/users/${id}/profile`, data),
  changePassword:(id, data)  => authClient.put(`/api/users/${id}/password`, data),
  togglePrivacy:  id => authClient.put(`/api/users/${id}/toggle-privacy`),
  getSuggested:   id => authClient.get(`/api/users/${id}/suggested`),
  // Admin
  getAllUsers:    (page=1) => authClient.get('/api/users', { params: { page } }),
  suspend:        id => authClient.put(`/api/users/${id}/suspend`),
  unsuspend:      id => authClient.put(`/api/users/${id}/unsuspend`),
  deleteUser:     id => authClient.delete(`/api/users/${id}`),
  setAdminRole:  (id, isAdmin) => authClient.put(`/api/users/${id}/profile`, { isAdmin }),
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postApi = {
  create:           data => postClient.post('/api/posts', data),
  getById:          id   => postClient.get(`/api/posts/${id}`),
  getPublic:       (page=1, pageSize=20) => postClient.get('/api/posts/public', { params: { page, pageSize } }),
  byUser:          (uid, page=1) => postClient.get(`/api/posts/by-user/${uid}`, { params: { page } }),
  timeline:        (uid, page=1) => postClient.get(`/api/posts/timeline/${uid}`, { params: { page } }),
  trending:        () => postClient.get('/api/posts/trending'),
  trendingHashtags:() => postClient.get('/api/posts/trending-hashtags'),
  byHashtag:       (tag, page=1) => postClient.get(`/api/posts/hashtag/${tag}`, { params: { page } }),
  search:          (q, page=1)   => postClient.get('/api/posts/search', { params: { q, page } }),
  update:          (id, data)    => postClient.put(`/api/posts/${id}`, data),
  delete:           id => postClient.delete(`/api/posts/${id}`),
  repost:          (originalPostId, content='') =>
    postClient.post('/api/posts', { content: content || '🔁 Reposted', originalPostId, visibility: 'PUBLIC' }),
}

// ── Likes ─────────────────────────────────────────────────────────────────────
export const likeApi = {
  toggle:     (targetId, targetType) => likeClient.post('/api/likes/toggle', { targetId, targetType }),
  hasLiked:   (targetId, targetType) => likeClient.get('/api/likes/has-liked', { params: { targetId, targetType } }),
  count:      (targetId, targetType) => likeClient.get('/api/likes/count', { params: { targetId, targetType } }),
  likers:      postId => likeClient.get(`/api/likes/post/${postId}/likers`),
  likedPosts:  userId => likeClient.get(`/api/likes/user/${userId}/posts`),
}

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentApi = {
  add:      data   => commentClient.post('/api/comments', data),
  getById:  id     => commentClient.get(`/api/comments/${id}`),
  topLevel: (postId, page=1) => commentClient.get(`/api/comments/post/${postId}/top-level`, { params: { page } }),
  replies:  commentId => commentClient.get(`/api/comments/${commentId}/replies`),
  count:    postId    => commentClient.get(`/api/comments/post/${postId}/count`),
  edit:    (id, content) => commentClient.put(`/api/comments/${id}`, { content }),
  delete:   id => commentClient.delete(`/api/comments/${id}`),
}

// ── Follows ───────────────────────────────────────────────────────────────────
export const followApi = {
  follow:      followeeId => followClient.post('/api/follows', { followeeId }),
  unfollow:    followeeId => followClient.delete(`/api/follows/${followeeId}`),
  accept:      followId   => followClient.put(`/api/follows/${followId}/accept`),
  reject:      followId   => followClient.put(`/api/follows/${followId}/reject`),
  followers:   userId     => followClient.get(`/api/follows/${userId}/followers`),
  following:   userId     => followClient.get(`/api/follows/${userId}/following`),
  pending:     ()         => followClient.get('/api/follows/pending'),
  isFollowing: followeeId => followClient.get(`/api/follows/is-following/${followeeId}`),
  followingIds:userId     => followClient.get(`/api/follows/${userId}/following-ids`),
  mutual:     (a, b)      => followClient.get(`/api/follows/mutual/${a}/${b}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifApi = {
  get:         (userId, page=1) => notifClient.get(`/api/notifications/${userId}`, { params: { page } }),
  unread:       userId => notifClient.get(`/api/notifications/${userId}/unread`),
  unreadCount:  userId => notifClient.get(`/api/notifications/${userId}/unread-count`),
  markRead:     id     => notifClient.put(`/api/notifications/${id}/read`),
  markAllRead:  userId => notifClient.put(`/api/notifications/${userId}/read-all`),
  delete:       id     => notifClient.delete(`/api/notifications/${id}`),
  broadcast:    data   => notifClient.post('/api/notifications/broadcast', data),
}

// ── Feed ──────────────────────────────────────────────────────────────────────
export const feedApi = {
  home:        (userId, page=1) => feedClient.get(`/api/feed/${userId}`, { params: { page } }),
  explore:     (userId, page=1) => feedClient.get(`/api/feed/explore/${userId}`, { params: { page } }),
  timeline:    (userId, page=1) => feedClient.get(`/api/feed/timeline/${userId}`, { params: { page } }),
  trending:    () => feedClient.get('/api/feed/trending-hashtags'),
  suggestions: userId => feedClient.get(`/api/feed/suggestions/${userId}`),
}
