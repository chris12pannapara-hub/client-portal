# Frontend — Client Portal

React application for the Client Portal.

## Tech Stack

- **React 18** with Hooks
- **React Router v6** for routing
- **Redux Toolkit** for state management
- **Axios** for API calls
- **Plain CSS** with CSS Grid + Flexbox

## Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```bash
REACT_APP_API_URL=http://localhost:3001
```

### 3. Start development server
```bash
npm start
```

The app will open at: http://localhost:3000

## Available Scripts
```bash
npm start      # Start dev server (port 3000)
npm build      # Build for production
npm test       # Run tests
```

## Project Structure
```
src/
├── components/      # Reusable components
│   ├── Auth/       # Authentication components
│   ├── Common/     # Shared UI components
│   ├── Dashboard/  # Dashboard-specific components
│   └── Layout/     # Layout components (Header, Sidebar, Footer)
├── pages/          # Page components
├── store/          # Redux store and slices
├── services/       # API service layer
├── hooks/          # Custom React hooks
├── styles/         # CSS files
└── utils/          # Utility functions
```

## Features

### Authentication
- Login with email/username + password
- JWT token management (in-memory, not localStorage)
- Automatic token refresh on 401 errors
- Protected routes with redirect to login

### State Management
- Redux Toolkit for global state
- Auth slice: user, tokens, loading states
- Notification slice: notifications, unread count

### UI/UX
- Responsive design (mobile, tablet, desktop)
- WCAG accessibility (aria labels, keyboard navigation)
- Loading states and error handling
- Toast notifications

### Security
- Tokens stored in memory (not localStorage)
- Automatic token refresh
- CSRF protection
- XSS protection

## Testing the App

### Test Credentials
```
Email: chris@portal.dev
Password: Chris@123!
```

### User Flow

1. Open http://localhost:3000
2. Should redirect to /login
3. Enter credentials and click "Sign In"
4. Should redirect to /dashboard
5. See user profile and notifications
6. Click notification bell to see notifications
7. Click "Logout" to sign out

## API Endpoints (via Middleware)
```
POST   /api/auth/login              # Login
POST   /api/auth/logout             # Logout
POST   /api/auth/refresh            # Refresh token
GET    /api/users/me                # Get current user
PATCH  /api/users/me                # Update profile
GET    /api/notifications           # List notifications
GET    /api/notifications/unread/count  # Unread count
PATCH  /api/notifications/read      # Mark as read
```

## Responsive Breakpoints
```css
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Common Issues

**"Cannot connect to API"**
→ Ensure Express middleware is running on port 3001

**"Login redirects to login"**
→ Check Redux DevTools - tokens should be in auth state

**"Notifications not loading"**
→ Check browser console for API errors