-- =============================================================================
-- CLIENT PORTAL — DATABASE SCHEMA
-- =============================================================================
-- Author      : Chris Pannapara
-- Description : Core schema for the client portal.
--               Covers authentication, session management, notifications,
--               and audit logging.
--
-- Tables      : users, sessions, notifications, audit_log
-- Extensions  : pgcrypto (UUID generation)
-- Run order   : This file runs FIRST (01_) before seed data (02_)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
-- pgcrypto gives us gen_random_uuid() for UUID primary keys.
-- UUIDs over integer IDs because:
--   1. Non-sequential — cannot enumerate records by guessing IDs (security)
--   2. Globally unique — safe across distributed microservices
--   3. Expose no business information (auto-increment IDs leak record counts)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- TABLE: users
-- =============================================================================
-- Central identity store. Every authenticated actor maps to one row here.
-- Passwords are NEVER stored plain text — FastAPI/Passlib bcrypt-hashes them.
--
-- Design decisions:
--   - email AND username are both unique login identifiers
--   - role drives RBAC in the Express middleware layer
--   - mfa_enabled supports FIDO2/WebAuthn flow (direct from resume)
--   - failed_login_attempts + locked_until = account lockout policy
--     Standard: lock after 5 failed attempts for 15 minutes
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   VARCHAR(255)  UNIQUE NOT NULL,
    username                VARCHAR(100)  UNIQUE NOT NULL,

    -- Stored as bcrypt hash: $2b$12$<22-char-salt><31-char-hash>
    -- NEVER plain text. FastAPI/Passlib handles this automatically.
    password_hash           VARCHAR(255)  NOT NULL,

    first_name              VARCHAR(100),
    last_name               VARCHAR(100),

    -- RBAC role — drives what the frontend shows and what APIs permit
    role                    VARCHAR(50)   NOT NULL DEFAULT 'user'
                                CHECK (role IN ('admin', 'manager', 'user')),

    is_active               BOOLEAN       NOT NULL DEFAULT TRUE,
    mfa_enabled             BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Account lockout tracking
    failed_login_attempts   INT           NOT NULL DEFAULT 0,
    locked_until            TIMESTAMPTZ,   -- NULL means not currently locked

    -- Flexible user preferences as JSON
    -- e.g. {"theme": "dark", "language": "en", "notifications": true}
    preferences             JSONB         DEFAULT '{}',

    last_login_at           TIMESTAMPTZ,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes on the columns we query most often
CREATE INDEX IF NOT EXISTS idx_users_email     ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username  ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);


-- =============================================================================
-- TABLE: sessions
-- =============================================================================
-- Tracks active refresh tokens per user.
-- Enables: "remember me", "logout from all devices", suspicious login alerts.
--
-- JWT Two-Token Strategy:
--   Access token   → short-lived (15 min), stateless JWT. Express verifies
--                    it using JWT_SECRET alone — zero DB lookups needed.
--   Refresh token  → long-lived (7 days), stored here. When access token
--                    expires, frontend sends refresh token to get a new one.
--                    Express validates against this table before issuing.
--
-- Security:
--   - Refresh tokens are single-use and rotated on each use
--   - Compromised token? Delete the row — immediately invalidated
--   - ip_address + user_agent stored for anomaly detection
-- =============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    refresh_token   TEXT        NOT NULL UNIQUE,

    -- Device context — powers the "Active Sessions" UI panel
    ip_address      INET,
    user_agent      TEXT,
    device_type     VARCHAR(50),   -- 'desktop' | 'mobile' | 'tablet'

    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id       ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions (refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at    ON sessions (expires_at);


-- =============================================================================
-- TABLE: notifications
-- =============================================================================
-- In-app notification store. Mirrors the multi-platform push notification.
--
-- The React frontend polls GET /api/notifications every 30 seconds.
-- The bell icon badge shows the count from the unread_notification_counts view.
--
-- metadata JSONB allows type-specific payloads without schema changes:
--   Security alert: {"ip": "192.168.1.1",  "action": "new_login_detected"}
--   System notice:  {"module": "payroll",   "deadline": "2025-03-31"}
--   Task update:    {"task_id": "uuid",     "status": "completed"}
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title       VARCHAR(255) NOT NULL,
    message     TEXT         NOT NULL,

    -- Controls icon + colour in the UI
    -- 'info'    -> blue  (general information)
    -- 'success' -> green (action completed)
    -- 'warning' -> amber (needs attention)
    -- 'alert'   -> red   (security event or critical issue)
    type        VARCHAR(50)  NOT NULL DEFAULT 'info'
                    CHECK (type IN ('info', 'success', 'warning', 'alert')),

    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ,   -- auto-set by trigger when is_read flips TRUE

    -- Where to navigate when the notification is clicked
    action_url  TEXT,

    metadata    JSONB        DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type    ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);


-- =============================================================================
-- TABLE: audit_log
-- =============================================================================
-- Immutable append-only record of all security-relevant system events.
--
-- RULE: Rows in this table are NEVER updated or deleted.
--       This is enforced at the application layer (FastAPI).
--
-- Events logged:
--   Auth     : login_success, login_failure, logout, token_refresh
--   Account  : password_change, mfa_enabled, mfa_disabled, account_locked
--   Admin    : user_created, user_deactivated, role_changed
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Nullable: failed logins for non-existent accounts still get logged
    user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,

    action      VARCHAR(100) NOT NULL,

    ip_address  INET,
    user_agent  TEXT,

    -- 'success' | 'failure' | 'error'
    outcome     VARCHAR(20)  NOT NULL DEFAULT 'success'
                    CHECK (outcome IN ('success', 'failure', 'error')),

    -- Event-specific payload:
    -- login_success: {"email": "...", "session_id": "uuid"}
    -- login_failure: {"email": "...", "reason": "invalid_password", "attempt": 3}
    -- role_changed:  {"old_role": "user", "new_role": "manager", "by": "admin_uuid"}
    metadata    JSONB        DEFAULT '{}',

    -- No updated_at — this table is append-only
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_outcome ON audit_log (outcome);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ip      ON audit_log (ip_address);


-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger function: auto-update users.updated_at on every UPDATE
-- PostgreSQL requires a trigger for this — it does NOT do it automatically.
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Trigger function: auto-set notifications.read_at when is_read flips TRUE
-- Saves every caller from having to set two columns manually.
CREATE OR REPLACE FUNCTION trigger_set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_notification_read_at();


-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active (non-expired, non-revoked) sessions — powers "My Devices" UI panel
CREATE OR REPLACE VIEW active_sessions AS
    SELECT
        s.id,
        s.user_id,
        u.email,
        u.username,
        s.ip_address,
        s.user_agent,
        s.device_type,
        s.created_at   AS session_started,
        s.last_used_at AS last_activity,
        s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.is_revoked = FALSE
      AND s.expires_at > NOW();

-- Unread count per user — powers the notification bell badge
CREATE OR REPLACE VIEW unread_notification_counts AS
    SELECT
        user_id,
        COUNT(*) AS unread_count
    FROM notifications
    WHERE is_read = FALSE
    GROUP BY user_id;

-- Last 90 days of audit events — powers the admin security dashboard
CREATE OR REPLACE VIEW recent_audit_events AS
    SELECT
        a.id,
        a.action,
        a.outcome,
        a.ip_address,
        a.metadata,
        a.created_at,
        u.email,
        u.username
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.created_at > NOW() - INTERVAL '90 days'
    ORDER BY a.created_at DESC;