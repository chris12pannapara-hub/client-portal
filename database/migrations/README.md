# Database Migrations

## What are migrations?

A migration is a versioned SQL file that describes a **change** to the schema.
Instead of editing `01_schema.sql` directly every time the schema changes,
you create a new migration file that applies only the delta.

This means:
- Every schema change is tracked in Git
- You can replay the full history of schema changes on any machine
- Your teammates can apply the same changes with one command
- You can roll back a bad change (if you write a down migration)

## Migration Naming Convention
```
migrations/
├── 001_initial_schema.sql          ← baseline (copy of 01_schema.sql)
├── 002_add_user_avatar.sql         ← adds avatar_url to users table
├── 003_add_notification_priority.sql
└── 004_sessions_add_device_name.sql
```

Each filename starts with a zero-padded number so they sort and run in order.

## How to write a migration
```sql
-- migrations/002_add_user_avatar.sql
-- Description: Add avatar_url to users table for profile picture support
-- Author: Chris Pannapara
-- Date: 2026-02-20

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Always add an index if you'll query by this column
-- (avatar_url is display-only, so no index needed here)
```

## Running migrations manually
```bash
# Connect to your running Docker container
docker-compose exec postgres psql -U portal_user -d client_portal

# Inside psql, run a migration file
\i /path/to/migration.sql

# Or from your host machine:
psql -h localhost -U portal_user -d client_portal -f migrations/002_add_user_avatar.sql
```

## In Tier 2 (FastAPI backend), we use Alembic

Alembic is the Python migration tool for SQLAlchemy. It auto-generates
migration files from your model changes. The `migrations/` folder here
is for raw SQL reference — Alembic will have its own `alembic/versions/`
folder in the backend tier.

## Golden Rules

1. **Never edit a migration that has already been run** — create a new one
2. **Always test migrations on a copy of prod data** before applying to prod
3. **Write both UP and DOWN migrations** — up applies the change, down reverts it
4. **Commit migrations to Git** — they are code, not just database admin tasks