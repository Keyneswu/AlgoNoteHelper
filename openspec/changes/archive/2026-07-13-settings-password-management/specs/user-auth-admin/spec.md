## ADDED Requirements

### Requirement: Self-service password change
The system SHALL allow any authenticated user, from Settings, to change their own password by providing the current password, a new password, and a confirmation of the new password. The new password MUST meet the application's minimum length (at least 8 characters). On success, the system SHALL revoke the user's other sessions while keeping the current session valid.

#### Scenario: Successful password change
- **WHEN** a signed-in user submits a correct current password and a matching new password and confirmation that meet the minimum length
- **THEN** the password is updated and other active sessions for that user are revoked

#### Scenario: Confirmation mismatch blocked locally
- **WHEN** a signed-in user submits a new password that does not match the confirmation
- **THEN** the system does not call the password-change API and shows a validation error

#### Scenario: Incorrect current password rejected
- **WHEN** a signed-in user submits an incorrect current password
- **THEN** the password is not changed and the user sees an error

#### Scenario: Unauthenticated user cannot change password
- **WHEN** an anonymous visitor opens Settings
- **THEN** they are redirected to login and cannot use the password-change form

### Requirement: Admin password reset
The system SHALL allow admin users, from Settings user management, to set a new password for any listed user without requiring that user's current password. The new password MUST meet the application's minimum length (at least 8 characters). On success, the system SHALL revoke all sessions for the target user. Non-admin users MUST NOT see or use password-reset controls for other users.

#### Scenario: Admin resets a user's password
- **WHEN** an admin sets a valid new password for a selected user from Settings
- **THEN** that user's password is updated and all of that user's sessions are revoked

#### Scenario: Non-admin cannot reset others' passwords
- **WHEN** a non-admin user opens Settings
- **THEN** controls to reset another user's password are not available

#### Scenario: Reset with short password rejected
- **WHEN** an admin attempts to reset a password shorter than the minimum length
- **THEN** the password is not changed
