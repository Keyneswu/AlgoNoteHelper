## Context

AlgoNoteHelper authenticates with Better Auth (`emailAndPassword` enabled, public signup disabled). Settings already hosts LLM config for all users and admin-only user create/list via `authClient.admin.*`. Passwords live on the credential account; Better Auth already exposes `changePassword` and `admin.setUserPassword` without new plugins or migrations.

Reference UX for admin reset: Job-Ops Settings workspace users (inline new password + Reset, revoke sessions after reset). Self-change is stricter than Job-Ops: require current password and confirm new password.

## Goals / Non-Goals

**Goals:**

- Let any signed-in user change their password from Settings with current + new + confirm.
- Revoke other sessions on successful self-change (`revokeOtherSessions: true`).
- Let admins reset any user's password from the Settings user list without knowing the old password.
- After admin reset, revoke all sessions for that user so old devices cannot stay logged in.
- Ship en / zh-CN copy for labels, success, and common errors.

**Non-Goals:**

- Email / token forgot-password flow
- Forcing password change on next login after admin reset
- Admin resetting their own password through the admin API (admins use the self-change form)
- Password strength meter beyond Better Auth min length (default 8)
- Changing username/email in this change

## Decisions

1. **Use Better Auth client APIs, not custom BFF routes**  
   - Self: `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })`  
   - Admin: `authClient.admin.setUserPassword({ userId, newPassword })` then `authClient.admin.revokeUserSessions({ userId })`  
   - Rationale: already wired through `/api/auth/[...all]`; avoids duplicating hashing/session logic.  
   - Alternative: custom `/api/bff/...` wrappers — rejected as unnecessary indirection.

2. **Confirm new password only on the client**  
   - Better Auth does not accept a confirm field; mismatch is blocked before the request.  
   - Same pattern for admin reset confirm if the UI asks for confirmation.

3. **Admin reset UI mirrors Job-Ops inline pattern**  
   - Per user row: new password field (+ optional confirm) and Reset action.  
   - Keep create-user form as-is; do not overload it for resets.

4. **Self-change is a separate Settings card visible to all authenticated users**  
   - Placed above or beside LLM config so non-admins can find it without seeing admin controls.

5. **Session revocation policy**  
   - Self-change: revoke *other* sessions (current stays).  
   - Admin reset: revoke *all* sessions for the target (including active browsers).  
   - Rationale: recovery and compromise cases should force re-login with the new password.

6. **Minimum length**  
   - Rely on Better Auth default (`minPasswordLength: 8`); align disabled submit / client checks with that floor, consistent with setup/login placeholders.

## Risks / Trade-offs

- **[Admin can set any password]** → Acceptable under existing admin trust model (admins already create accounts). Mitigate by keeping the control admin-only and showing clear success/error feedback.  
- **[`setUserPassword` alone may leave sessions alive]** → Always call `revokeUserSessions` after a successful set; treat partial failure (password set, revoke failed) as an error to surface to the admin.  
- **[Wrong current password / network errors]** → Surface Better Auth error messages via i18n-friendly fallbacks; do not clear the form on failure except optionally clearing new/confirm after success.  
- **[No email recovery]** → Documented non-goal; admin reset is the MVP recovery path.

## Migration Plan

- No database migration. Deploy frontend Settings UI + i18n only.  
- Rollback: revert Settings/i18n changes; Better Auth endpoints remain unused.

## Open Questions

- None blocking implementation. Optional later: after admin reset, show a one-time temporary password copy affordance (out of scope unless needed during apply).
