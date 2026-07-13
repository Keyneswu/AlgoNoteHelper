## Why

Logged-in users cannot change their own password, and there is no recovery path when a password is forgotten—public signup is disabled and email reset is not configured. Admins can create users but cannot reset passwords, so a forgotten credential can permanently lock someone out of their notes.

## What Changes

- Add a Settings section for any authenticated user to change their own password (current password, new password, confirmation).
- On successful self-change, revoke other sessions for that user while keeping the current session.
- Extend the admin user-management UI so admins can reset any user's password (new password only; no current password required).
- On successful admin reset, revoke all sessions for the target user.
- Add i18n strings (en / zh-CN) for the new flows and error messages.
- No email-based forgot-password flow in this change.

## Capabilities

### New Capabilities

<!-- none — extends existing auth/admin capability -->

### Modified Capabilities

- `user-auth-admin`: Add requirements for self-service password change and admin password reset (including session revocation behavior).

## Impact

- Frontend: `frontend/src/app/settings/page.tsx`, `frontend/messages/en.json`, `frontend/messages/zh-CN.json`
- Auth client: existing Better Auth APIs (`authClient.changePassword`, `authClient.admin.setUserPassword`, `authClient.admin.revokeUserSessions`) — no new auth server plugins or schema migrations expected
- Spec: `openspec/specs/user-auth-admin/spec.md` (via delta)
