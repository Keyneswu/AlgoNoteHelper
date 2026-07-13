## 1. i18n

- [x] 1.1 Add English strings in `frontend/messages/en.json` for self-change password (labels, confirm mismatch, success, errors) and admin reset (labels, success, errors)
- [x] 1.2 Add matching Chinese strings in `frontend/messages/zh-CN.json`

## 2. Self-service password change

- [x] 2.1 Add a Settings card/section for all authenticated users with current password, new password, and confirm fields
- [x] 2.2 Validate confirm match and min length (8) client-side before calling the API
- [x] 2.3 Call `authClient.changePassword` with `revokeOtherSessions: true`; show success/error and clear sensitive fields on success

## 3. Admin password reset

- [x] 3.1 Extend the admin user list UI with per-user new password input and Reset action (Job-Ops-style inline pattern)
- [x] 3.2 On Reset, call `authClient.admin.setUserPassword` then `authClient.admin.revokeUserSessions`; surface errors if either step fails
- [x] 3.3 Disable Reset when password is under minimum length; clear the row input on success

## 4. Verification

- [x] 4.1 Manually verify self-change: wrong current password fails; confirm mismatch does not hit API; success keeps current session and updates login with new password
- [x] 4.2 Manually verify admin reset: non-admin cannot see controls; admin reset updates password and forces re-login on other sessions
