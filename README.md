
# FullStack Client Portal 🚀

# Enterprise Client Portal Architecture

# Production Ready which you can very well use for your business big or small

**Fork it. Star it. Change it. Show it off .**

https://github.com/chris12pannapara-hub/client-portal.git

**A battle-tested, enterprise-grade Client Portal** that mirrors production authentication flows,
microservices architecture, slick React UI, and automated testing suites.
Built by a full-stack dev who's loves to create applications that can help society. JKJK still learning!!!

> *Think of it as the software equivalent of a well-aged steak: robust, flavorful, and ready to impress at any dev dinner party.*



## 🎯 Quick Start (4-Terminal Orchestration)

**Prerequisites:** Docker Desktop running. Wake it up if it's napping.

### Terminal 1: PostgreSQL Database
```bash
cd database
docker-compose up -d
```
*⏳ Wait ~15s for Postgres to initialize its coffee.*

### Terminal 2: FastAPI Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 3: Express Middleware (BFF)
```bash
cd middleware
npm run dev
```

### Terminal 4: React Frontend
```bash
cd frontend
npm start
```

**🌐 Access:** http://localhost:3000  
**🧪 Test Credentials:** `chris@portal.dev` / `Chris@123!`

# Architecture Flow



## 🖥️ Frontend (React 18)

[React Frontend]

**Tech Stack:** React 18 + Redux Toolkit + Axios + CSS Grid/Flexbox

**✨ Features:**
- JWT auth with auto-refresh (memory-only tokens)
- Responsive design (mobile → desktop)
- WCAG accessibility + toast notifications
- Protected routes + loading states

**📱 Flow:** Login → Dashboard → Notifications → Logout

---

## 🛡️ Middleware (Express BFF - Port 3001)

**The unsung hero** between React and FastAPI. **Why BFF?**
- 🔐 JWT verification before backend hits
- 🛑 Rate limiting (auth: 10/15min)
- 🛡️ Helmet.js security headers
- 🌐 CORS management
- 📏 Request/response shaping

**🔑 CRITICAL:** `JWT_SECRET` must match backend `.env`

---

## ⚙️ Backend (FastAPI - Port 8000)

**Tech Stack:** FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic + pytest

**🏗️ Architecture:**
```
Routes (HTTP) → Services (Business Logic) → Models (Database)
```

**📚 Auto-docs:** http://localhost:8000/docs (Swagger UI)

**🔐 Two-Token Strategy:**
- Access token: 15min, stateless JWT
- Refresh token: 7 days, revocable (DB stored)

---

## 🗄️ Database (PostgreSQL 15)

**🧠 Production Design Decisions:**
- 🔑 UUIDv4 PKs (no enumeration attacks)
- 🔒 bcrypt cost=12 password hashing
- ⛓️ Account lockout after 5 failed attempts
- 📝 Immutable audit_log (no UPDATE/DELETE)
- 🎯 JSONB for flexible metadata/preferences
- ⚡ Triggers for auto-timestamps

**📋 Schema:** `users` → `sessions`/`notifications`/`audit_log`

**👥 Test Users:**
| Email | Password | Role |
|-------|----------|------|
| `chris@portal.dev` | `Chris@123!` | user |
| `admin@portal.dev` | `Admin@123!` | admin |

---

## 🎪 Battle-Tested

This isn't toy code. Every design decision has a "why" that survives senior engineer scrutiny:

```
✅ UUIDs over sequential IDs
✅ BFF security layer  
✅ Two-token JWT rotation
✅ Rate limiting + lockouts
✅ Immutable audit trails
✅ Dependency injection
✅ Proper layering (Routes→Services→Models)
```

---
*Built by a dev who actually reads the error logs and values QA*
