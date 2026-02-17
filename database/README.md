# Database — Client Portal

PostgreSQL 15 schema for the client portal.
This README explains every design decision so you can discuss it in interviews.

## Quick Start
```bash
# From this directory:
docker-compose up -d

# Wait ~15 seconds for PostgreSQL to initialize, then verify:
docker-compose exec postgres psql -U portal_user -d client_portal -c "\dt"
```

Expected output — four tables:
```
         List of relations
 Schema |    Name       | Type  |    Owner
--------+---------------+-------+-------------
 public | audit_log     | table | portal_user
 public | notifications | table | portal_user
 public | sessions      | table | portal_user
 public | users         | table | portal_user
```

## Schema Overview
```
users ──────────────────────────┐
  id (PK, UUID)                 │
  email (UNIQUE)                │ 1:many
  username (UNIQUE)             │
  password_hash (bcrypt)        ├──── sessions
  role (admin|manager|user)     │       id (PK)
  is_active                     │       refresh_token (UNIQUE)
  mfa_enabled                   │       ip_address, user_agent
  failed_login_attempts         │       expires_at, is_revoked
  locked_until                  │
  preferences (JSONB)           ├──── notifications
                                │       id (PK)
                                │       title, message, type
                                │       is_read, read_at
                                │       metadata (JSONB)
                                │
                                └──── audit_log
                                        id (PK)
                                        action, outcome
                                        ip_address
                                        metadata (JSONB)
```

## Key Design Decisions

### UUIDs as Primary Keys
Integer auto-increment IDs are sequential — an attacker can enumerate
records by guessing `/users/1`, `/users/2`, etc. UUIDs (version 4) are
random 128-bit values — practically impossible to guess.

### Two-Token JWT Strategy
- **Access token** (15 min): Stateless JWT. Express verifies with a secret.
  No database lookup = fast and scalable.
- **Refresh token** (7 days): Stored in the `sessions` table. Single-use,
  rotated on each refresh. Can be revoked instantly by deleting the row.

### bcrypt Password Hashing
Passwords are hashed with bcrypt (cost factor 12) before storage.
bcrypt is slow by design — it takes ~250ms to hash, making brute-force
attacks impractical. Never MD5, SHA-1, or SHA-256 for passwords.

### Account Lockout
After 5 failed logins, `locked_until` is set to 15 minutes in the future.
The FastAPI service checks this on every login attempt. This prevents
credential-stuffing attacks without permanently locking valid users.

### JSONB for Flexible Payloads
`preferences`, `metadata`, and `audit_log.metadata` use JSONB (binary JSON).
PostgreSQL indexes JSONB columns and supports JSON path queries.
This avoids schema changes every time you need to store a new field.

### Immutable Audit Log
The `audit_log` table has no `UPDATE` or `DELETE` allowed at the app layer.
This ensures a tamper-evident history of all security events — required
in regulated industries (finance, HR, healthcare).

### Triggers
Two PostgreSQL triggers handle automatic timestamp management:
1. `set_users_updated_at` — fires on every UPDATE to `users`
2. `set_notification_read_at` — auto-sets `read_at` when `is_read` flips TRUE

## Test Credentials (seed data only)

| Email | Password | Role | Notes |
|---|---|---|---|
| admin@portal.dev | Admin@123! | admin | MFA enabled |
| manager@portal.dev | Manager@123! | manager | Normal account |
| chris@portal.dev | Chris@123! | user | Primary demo account |
| locked@portal.dev | Locked@123! | user | Account locked |
| inactive@portal.dev | Inactive@123! | user | is_active = FALSE |

## Useful psql Commands
```bash
# Connect
docker-compose exec postgres psql -U portal_user -d client_portal

# Once connected:
\dt                              # List all tables
\d users                         # Describe users table (columns, types, indexes)
\dv                              # List all views

# Useful queries
SELECT email, role, is_active, failed_login_attempts FROM users;
SELECT * FROM unread_notification_counts;
SELECT * FROM active_sessions;
SELECT action, outcome, ip_address, created_at FROM audit_log ORDER BY created_at DESC LIMIT 10;
```

## Tech Stack

| Component | Choice | Why |
|---|---|---|
| Database | PostgreSQL 15 | Industry standard, JSONB support, triggers, views |
| Container | Docker + Alpine | Reproducible local dev, matches production |
| UUID generation | pgcrypto | Native PostgreSQL extension, no app-layer dependency |
| Password hashing | bcrypt (app layer) | Adaptive cost factor, industry standard |