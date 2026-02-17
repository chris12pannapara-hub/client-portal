-- =============================================================================
-- CLIENT PORTAL — SEED DATA
-- =============================================================================
-- Author      : Chris Pannapara
-- Description : Realistic test data for local development and Selenium tests.
--               Passwords shown in comments — hashes generated with bcrypt
--               cost factor 12 (matching FastAPI/Passlib default).
--
-- IMPORTANT   : Run 01_schema.sql FIRST, then this file.
-- NEVER       : Import this file into a production database.
-- =============================================================================


-- =============================================================================
-- SEED USERS
-- =============================================================================
-- Four users covering all RBAC roles:
--   1. admin@portal.dev    (admin)   password: Admin@123!
--   2. manager@portal.dev  (manager) password: Manager@123!
--   3. chris@portal.dev    (user)    password: Chris@123!
--   4. locked@portal.dev   (user)    password: Locked@123! — account locked
--
-- These bcrypt hashes were generated with: passlib.hash.bcrypt.hash("password")
-- You CANNOT reverse a bcrypt hash — always use the plaintext listed above.
--
-- NOTE: When you build the FastAPI /auth/register endpoint, it will hash
-- passwords automatically. These hardcoded hashes are ONLY for seed data.
-- =============================================================================

INSERT INTO users (
    id,
    email,
    username,
    password_hash,
    first_name,
    last_name,
    role,
    is_active,
    mfa_enabled,
    failed_login_attempts,
    locked_until,
    preferences,
    last_login_at,
    created_at
) VALUES

-- -----------------------------------------------------------------------
-- User 1: Admin — full system access
-- Password: Admin@123!
-- -----------------------------------------------------------------------
(
    'a1000000-0000-0000-0000-000000000001',
    'admin@portal.dev',
    'admin',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'System',
    'Administrator',
    'admin',
    TRUE,
    TRUE,       -- MFA enabled for admin (security best practice)
    0,
    NULL,
    '{"theme": "light", "language": "en", "notifications": true, "timezone": "America/New_York"}',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '180 days'
),

-- -----------------------------------------------------------------------
-- User 2: Manager — team visibility, limited admin
-- Password: Manager@123!
-- -----------------------------------------------------------------------
(
    'a2000000-0000-0000-0000-000000000002',
    'manager@portal.dev',
    'manager_sarah',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'Sarah',
    'Mitchell',
    'manager',
    TRUE,
    FALSE,
    0,
    NULL,
    '{"theme": "dark", "language": "en", "notifications": true, "timezone": "America/Chicago"}',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '90 days'
),

-- -----------------------------------------------------------------------
-- User 3: Regular user — Chris (the portfolio owner, for demos)
-- Password: Chris@123!
-- -----------------------------------------------------------------------
(
    'a3000000-0000-0000-0000-000000000003',
    'chris@portal.dev',
    'chris_p',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'Chris',
    'Pannapara',
    'user',
    TRUE,
    FALSE,
    0,
    NULL,
    '{"theme": "light", "language": "en", "notifications": true, "timezone": "America/Toronto"}',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '45 days'
),

-- -----------------------------------------------------------------------
-- User 4: Locked account — for testing account lockout Selenium tests
-- Password: Locked@123! (but account is locked — login should be refused)
-- -----------------------------------------------------------------------
(
    'a4000000-0000-0000-0000-000000000004',
    'locked@portal.dev',
    'locked_user',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'Dave',
    'Lockwood',
    'user',
    TRUE,
    FALSE,
    5,                            -- Max failed attempts reached
    NOW() + INTERVAL '15 minutes',-- Locked for another 15 minutes from now
    '{"theme": "light", "language": "en", "notifications": true}',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '20 days'
),

-- -----------------------------------------------------------------------
-- User 5: Deactivated account — for testing inactive account rejection
-- -----------------------------------------------------------------------
(
    'a5000000-0000-0000-0000-000000000005',
    'inactive@portal.dev',
    'inactive_user',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'Former',
    'Employee',
    'user',
    FALSE,    -- is_active = FALSE — this account has been deactivated
    FALSE,
    0,
    NULL,
    '{}',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '200 days'
);


-- =============================================================================
-- SEED SESSIONS
-- =============================================================================
-- One active session for the chris user (simulates a logged-in browser tab).
-- The refresh_token value here is fake — in production FastAPI generates real
-- cryptographically secure tokens. This is just for SQL completeness.
-- =============================================================================

INSERT INTO sessions (
    id,
    user_id,
    refresh_token,
    ip_address,
    user_agent,
    device_type,
    expires_at,
    is_revoked,
    created_at,
    last_used_at
) VALUES
(
    'b1000000-0000-0000-0000-000000000001',
    'a3000000-0000-0000-0000-000000000003',   -- chris@portal.dev
    'seed_refresh_token_chris_dev_only_not_real',
    '192.168.1.100'::INET,
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
    'desktop',
    NOW() + INTERVAL '7 days',
    FALSE,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '5 minutes'
);


-- =============================================================================
-- SEED NOTIFICATIONS
-- =============================================================================
-- A mix of all four types for the chris user.
-- This gives the Selenium tests real data to assert against.
-- =============================================================================

INSERT INTO notifications (
    id,
    user_id,
    title,
    message,
    type,
    is_read,
    action_url,
    metadata,
    created_at
) VALUES

-- Unread security alert (most urgent — red bell)
(
    'c1000000-0000-0000-0000-000000000001',
    'a3000000-0000-0000-0000-000000000003',
    'New Login Detected',
    'A new login was detected from Toronto, ON. If this was you, no action needed.',
    'alert',
    FALSE,
    '/profile/sessions',
    '{"ip": "192.168.1.100", "location": "Toronto, ON", "device": "Chrome on macOS"}',
    NOW() - INTERVAL '10 minutes'
),

-- Unread info notification
(
    'c2000000-0000-0000-0000-000000000002',
    'a3000000-0000-0000-0000-000000000003',
    'System Maintenance Scheduled',
    'Scheduled maintenance on Sunday Feb 23 from 2:00 AM – 4:00 AM EST.',
    'info',
    FALSE,
    NULL,
    '{"maintenance_window": "2026-02-23T02:00:00-05:00", "duration_hours": 2}',
    NOW() - INTERVAL '2 hours'
),

-- Unread success notification
(
    'c3000000-0000-0000-0000-000000000003',
    'a3000000-0000-0000-0000-000000000003',
    'Profile Updated Successfully',
    'Your account preferences were saved.',
    'success',
    FALSE,
    '/profile',
    '{}',
    NOW() - INTERVAL '1 day'
),

-- Already-read warning (tests the read state UI)
(
    'c4000000-0000-0000-0000-000000000004',
    'a3000000-0000-0000-0000-000000000003',
    'Password Expiry Reminder',
    'Your password will expire in 14 days. Please update it soon.',
    'warning',
    TRUE,
    '/profile/security',
    '{"days_remaining": 14}',
    NOW() - INTERVAL '3 days'
),

-- Old read info notification (tests pagination/scroll)
(
    'c5000000-0000-0000-0000-000000000005',
    'a3000000-0000-0000-0000-000000000003',
    'Welcome to Client Portal',
    'Your account has been set up. Explore your dashboard to get started.',
    'info',
    TRUE,
    '/dashboard',
    '{}',
    NOW() - INTERVAL '45 days'
),

-- Notifications for admin user
(
    'c6000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000001',
    'User Account Locked',
    'User locked@portal.dev has been locked after 5 failed login attempts.',
    'alert',
    FALSE,
    '/admin/users',
    '{"locked_user_id": "a4000000-0000-0000-0000-000000000004", "attempts": 5}',
    NOW() - INTERVAL '1 hour'
);


-- =============================================================================
-- SEED AUDIT LOG
-- =============================================================================
-- Representative history of events — this is what the admin security
-- dashboard will display. Shows a realistic auth event timeline.
-- =============================================================================

INSERT INTO audit_log (
    id,
    user_id,
    action,
    ip_address,
    user_agent,
    outcome,
    metadata,
    created_at
) VALUES

-- Chris logs in successfully
(
    'd1000000-0000-0000-0000-000000000001',
    'a3000000-0000-0000-0000-000000000003',
    'login_success',
    '192.168.1.100'::INET,
    'Mozilla/5.0 Chrome/120.0.0.0',
    'success',
    '{"email": "chris@portal.dev", "session_id": "b1000000-0000-0000-0000-000000000001"}',
    NOW() - INTERVAL '30 minutes'
),

-- Dave (locked user) fails login — attempt 1
(
    'd2000000-0000-0000-0000-000000000002',
    'a4000000-0000-0000-0000-000000000004',
    'login_failure',
    '203.0.113.42'::INET,
    'Mozilla/5.0 Firefox/121.0',
    'failure',
    '{"email": "locked@portal.dev", "reason": "invalid_password", "attempt": 1}',
    NOW() - INTERVAL '2 hours'
),

-- Dave fails again — attempt 2
(
    'd3000000-0000-0000-0000-000000000003',
    'a4000000-0000-0000-0000-000000000004',
    'login_failure',
    '203.0.113.42'::INET,
    'Mozilla/5.0 Firefox/121.0',
    'failure',
    '{"email": "locked@portal.dev", "reason": "invalid_password", "attempt": 2}',
    NOW() - INTERVAL '2 hours' + INTERVAL '2 minutes'
),

-- Dave hits max attempts — account locks
(
    'd4000000-0000-0000-0000-000000000004',
    'a4000000-0000-0000-0000-000000000004',
    'account_locked',
    '203.0.113.42'::INET,
    'Mozilla/5.0 Firefox/121.0',
    'success',
    '{"email": "locked@portal.dev", "attempts": 5, "locked_until": "15 minutes"}',
    NOW() - INTERVAL '90 minutes'
),

-- Admin logs in
(
    'd5000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'login_success',
    '10.0.0.1'::INET,
    'Mozilla/5.0 Chrome/120.0.0.0',
    'success',
    '{"email": "admin@portal.dev"}',
    NOW() - INTERVAL '2 hours'
),

-- Unknown email attempted — user_id is NULL
(
    'd6000000-0000-0000-0000-000000000006',
    NULL,
    'login_failure',
    '198.51.100.77'::INET,
    'python-requests/2.31.0',
    'failure',
    '{"email": "hacker@evil.com", "reason": "user_not_found"}',
    NOW() - INTERVAL '4 hours'
),

-- Token refresh event
(
    'd7000000-0000-0000-0000-000000000007',
    'a3000000-0000-0000-0000-000000000003',
    'token_refresh',
    '192.168.1.100'::INET,
    'Mozilla/5.0 Chrome/120.0.0.0',
    'success',
    '{"session_id": "b1000000-0000-0000-0000-000000000001"}',
    NOW() - INTERVAL '15 minutes'
);


-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these manually in psql or your DB client to confirm seed data loaded.
-- (These are SELECT-only — safe to run anytime.)
-- =============================================================================

-- SELECT id, email, username, role, is_active, failed_login_attempts FROM users;
-- SELECT id, user_id, device_type, expires_at, is_revoked FROM sessions;
-- SELECT id, user_id, title, type, is_read FROM notifications ORDER BY created_at DESC;
-- SELECT id, action, outcome, ip_address FROM audit_log ORDER BY created_at DESC;
-- SELECT * FROM unread_notification_counts;
-- SELECT * FROM active_sessions;