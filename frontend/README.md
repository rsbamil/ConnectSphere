# ConnectSphere Frontend

React 18 + Tailwind CSS frontend for the ConnectSphere social media platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 with hooks |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 with custom design tokens |
| HTTP | Axios with per-service instances |
| Notifications | react-hot-toast |
| Dates | date-fns |
| Build | Vite 5 |

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── MainLayout.jsx      # Sidebar + topbar for logged-in users
│   │   ├── GuestLayout.jsx     # Minimal header for landing/public pages
│   │   └── AdminLayout.jsx     # Admin panel sidebar
│   ├── posts/
│   │   ├── PostCard.jsx        # Full post display with like/comment/share
│   │   └── CreatePostForm.jsx  # Compose new post
│   ├── comments/
│   │   └── CommentThread.jsx   # 2-level nested comments
│   └── ui/
│       ├── Avatar.jsx          # Initials fallback avatar
│       └── index.jsx           # Spinner, Modal, EmptyState, Skeleton
│
├── contexts/
│   └── AuthContext.jsx         # Global auth state + role checks
│
├── pages/
│   ├── HomePage.jsx            # Home feed (Redis cached)
│   ├── ExplorePage.jsx         # Trending posts, explore, hashtags
│   ├── ProfilePage.jsx         # User profile with follow button
│   ├── PostDetailPage.jsx      # Single post + full comment thread
│   ├── NotificationsPage.jsx   # In-app notifications
│   ├── SearchPage.jsx          # Search people and posts
│   ├── HashtagPage.jsx         # Posts by hashtag
│   ├── SettingsPage.jsx        # Profile, password, privacy settings
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── LandingPage.jsx         # Public landing (Guest role)
│   └── admin/
│       ├── AdminDashboard.jsx  # Stats overview + role explanation
│       ├── AdminUsers.jsx      # User management table
│       ├── AdminPosts.jsx      # Post moderation
│       └── AdminBroadcast.jsx  # Send platform-wide notifications
│
└── services/
    └── api.js                  # All API calls — one file per microservice
```

---

## Role System — How It Works

### 👤 Guest (not logged in)
- `AuthContext.user === null`
- Can access: landing page, public posts, profiles, hashtag feeds
- Cannot: post, like, comment, follow, see notifications
- Route guard: `<RedirectIfAuthed>` prevents access to login/register if already authed

### ✅ User (logged in, isAdmin = false)
- Full social features: create posts, like, comment, follow, receive notifications
- Can view/edit own posts and comments
- Cannot access `/admin/*` routes — redirected to `/`
- Route guard: `<RequireAuth>` redirects guests to `/login`

### 🛡️ Admin (logged in, isAdmin = true)
- All user features plus the Admin Panel at `/admin`
- Can suspend/delete any user account
- Can delete any post or comment
- Can send platform-wide broadcast notifications
- Route guard: `<RequireAdmin>` checks `user.isAdmin === true`

### Creating the First Admin

The `isAdmin` field is **not settable via the API** (by design — no self-promotion exploit).
To create the first admin, run this SQL in your Neon console:

```sql
UPDATE auth_users
SET "IsAdmin" = true
WHERE "Email" = 'your@email.com';
```

After running this, that user's next login will include `isAdmin: true` in the JWT,
and the Admin Panel link will appear in their sidebar.

---

## Local Development

```bash
# Prerequisites: Node 18+, backend services running via docker-compose

# Install
npm install

# Copy and configure env
cp .env.example .env
# For local dev, leave all VITE_* vars empty — Vite proxy handles routing

# Start dev server (Vite proxy → backend services)
npm run dev
# App runs at http://localhost:3000
```

### Vite Proxy (local dev)
`vite.config.js` proxies all `/api/*` routes to the appropriate backend service:
- `/api/users`         → http://localhost:5001 (Auth)
- `/api/posts`         → http://localhost:5002 (Post)
- `/api/likes`         → http://localhost:5003 (Like)
- `/api/comments`      → http://localhost:5004 (Comment)
- `/api/follows`       → http://localhost:5005 (Follow)
- `/api/notifications` → http://localhost:5006 (Notif)
- `/api/feed`          → http://localhost:5007 (Feed)

---

## Deploy to Render (Static Site)

```bash
npm run build
# Output: dist/
```

In Render:
1. **New** → **Static Site**
2. Connect GitHub repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables (all `VITE_*` from `.env.example`) with your service URLs

---

## Design System

### Colors (Tailwind custom tokens)
| Token | Value | Usage |
|---|---|---|
| `cs-bg` | `#0a0b0f` | Page background |
| `cs-surface` | `#111318` | Cards, panels |
| `cs-border` | `#1e2028` | Borders |
| `cs-muted` | `#2a2d38` | Hover states, inputs |
| `cs-text` | `#e8eaf0` | Primary text |
| `cs-subtle` | `#6b7280` | Secondary text |
| `cs-accent` | `#f59e0b` | Amber — buttons, highlights |
| `cs-blue` | `#3b82f6` | Comments, info |
| `cs-green` | `#10b981` | Success, followers |
| `cs-red` | `#ef4444` | Likes, errors |
| `cs-purple` | `#8b5cf6` | Admin, private |

### Typography
- **Display**: Clash Display (headings, logo)
- **Body**: DM Sans (all body text)
- **Mono**: JetBrains Mono (code snippets)
