# Express Middleware — Client Portal

Backend For Frontend (BFF) layer that sits between React and FastAPI.

## Why This Layer Exists
```
React (3000) → Express (3001) → FastAPI (8000) → PostgreSQL (5432)
```

**Benefits:**
1. **Security** — React never talks directly to the backend
2. **JWT Verification** — Express validates tokens before forwarding
3. **Rate Limiting** — Prevents abuse
4. **Request Shaping** — Transforms responses for frontend needs
5. **CORS Management** — Handles cross-origin requests properly

---

## Setup

### 1. Install dependencies
```bash
cd middleware
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

**CRITICAL:** Set `JWT_SECRET` to the **SAME value** as your FastAPI backend:
```bash
# Copy this from backend/.env
JWT_SECRET=your-secret-key-here-must-match-backend
```

### 3. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The middleware will be available at: http://localhost:3001

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (rate limited: 10/15min) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (requires auth) |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update profile |
| POST | `/api/users/me/password` | Change password |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications (paginated) |
| GET | `/api/notifications/unread/count` | Get unread count |
| PATCH | `/api/notifications/read` | Mark as read |

---

## Testing the Middleware

### Using cURL
```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_username": "chris@portal.dev",
    "password": "Chris@123!"
  }'

# Copy the access_token from response, then:

# Get current user
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## Architecture

### Request Flow
```
1. React sends request to Express (port 3001)
2. Express validates JWT token
3. Express checks rate limits
4. Express forwards to FastAPI (port 8000)
5. FastAPI queries PostgreSQL
6. FastAPI returns response
7. Express forwards response to React
```

### Security Features

- **Helmet.js** — Security headers (XSS protection, etc.)
- **CORS** — Only allows requests from React (port 3000)
- **Rate Limiting** — 100 requests per 15 minutes (general), 10/15min (auth)
- **JWT Verification** — Validates tokens before forwarding
- **Input Validation** — express-validator on all inputs

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `BACKEND_URL` | FastAPI URL | `http://localhost:8000` |
| `JWT_SECRET` | **Must match backend** | (32+ chars) |
| `CORS_ORIGIN` | React frontend URL | `http://localhost:3000` |

---

## Common Issues

**"JWT verification failed"**
→ Ensure `JWT_SECRET` matches backend/.env

**"Backend service unavailable"**
→ Ensure FastAPI is running on port 8000

**"CORS error in browser"**
→ Check `CORS_ORIGIN` matches your React dev server URL

**"Too many requests"**
→ You've hit the rate limit. Wait 15 minutes or increase `RATE_LIMIT_MAX_REQUESTS`