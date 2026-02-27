# Backend —  Client Portal

FastAPI-based authentication and user management service.

## Tech Stack

- **Framework:** FastAPI 0.109
- **Database ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt (passlib)
- **Validation:** Pydantic v2
- **Testing:** pytest

## Setup

### 1. Create virtual environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Mac/Linux
# venv\Scripts\activate   # On Windows
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
```

Generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Paste the output into `.env` as `SECRET_KEY`.

### 4. Ensure PostgreSQL is running
```bash
cd ../database
docker-compose up -d
```

### 5. Run the server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

## API Documentation

Once the server is running, visit:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Available Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login with email/username + password |
| POST | /api/v1/auth/refresh | Get new access token using refresh token |
| POST | /api/v1/auth/logout | Revoke refresh token(s) |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/users/me | Get current user profile |
| PATCH | /api/v1/users/me | Update current user profile |
| POST | /api/v1/users/me/password | Change password |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/notifications | List notifications (paginated) |
| GET | /api/v1/notifications/unread/count | Get unread count |
| PATCH | /api/v1/notifications/read | Mark notification(s) as read |

## Testing the API

### Using cURL
```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_username": "chris@portal.dev",
    "password": "Chris@123!"
  }'

# Copy the access_token from the response, then:

# Get current user
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Using Swagger UI

1. Open http://localhost:8000/docs
2. Click "Authorize" button (top right)
3. Login via POST /api/v1/auth/login
4. Copy the `access_token` from the response
5. Paste it into the authorization popup
6. Now you can test all protected endpoints

## Project Structure
```
backend/
├── app/
│   ├── api/v1/           # API route handlers
│   ├── core/             # Config, security, dependencies
│   ├── db/               # Database connection
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── services/         # Business logic layer
│   └── main.py           # FastAPI app entry point
├── tests/                # pytest test suite
├── alembic/              # Database migrations
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables (not in Git)
```

## Key Design Patterns

### Three-Layer Architecture
```
Routes (HTTP) → Services (Business Logic) → Models (Database)
```

- **Routes** validate input, call services, return responses
- **Services** contain business rules, call database via ORM
- **Models** define database schema via SQLAlchemy

### Dependency Injection

FastAPI's `Depends()` provides automatic:
- Database session management (auto-commit/rollback)
- JWT authentication (extracts and verifies tokens)
- Role-based access control

### Two-Token JWT Strategy

- **Access token** (15 min): Stateless, verified by middleware
- **Refresh token** (7 days): Stored in database, can be revoked

## Running Tests
```bash
pytest tests/ -v
```

## Common Issues

**"Import error: No module named 'app'"**
→ Make sure you're in the backend/ directory and venv is activated

**"Could not connect to database"**
→ Ensure PostgreSQL container is running: `cd ../database && docker-compose ps`

**"SECRET_KEY too short"**
→ Generate a new one: `python -c "import secrets; print(secrets.token_urlsafe(32))"`