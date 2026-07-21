# user-auth-admin Specification

## Purpose
TBD - created by archiving change init-algonote-helper. Update Purpose after archive.
## Requirements
### Requirement: Email and password authentication
The system SHALL authenticate users with email and password via Better Auth, with public self-registration disabled for MVP.

#### Scenario: Login with email and password
- **WHEN** an existing user submits a valid email and password
- **THEN** the system creates an authenticated session and grants access to the app

#### Scenario: Public registration unavailable
- **WHEN** an anonymous visitor attempts to open a public sign-up flow
- **THEN** the system does not provide a public registration path that creates accounts

### Requirement: Cookie gate for protected app routes
The frontend SHALL redirect unauthenticated visitors away from protected app routes (`/notes`, `/ask`, `/import`, `/settings`, and their subpaths) when no session cookie is present, before those pages render. Login, setup, and auth API routes remain reachable without a session. Cookie presence is an optimistic gate only; BFF and API endpoints remain the source of truth for authorization. Client session hooks used for page gating SHALL not treat a transient null `useSession()` value as logged-out when an explicit session check has already succeeded.

#### Scenario: Unauthenticated visitor opens notes
- **WHEN** a visitor without a session cookie requests `/notes` or another protected app route
- **THEN** the response redirects to `/login` and the protected page content is not rendered

#### Scenario: Authenticated visitor keeps access
- **WHEN** a signed-in user with a session cookie requests a protected app route
- **THEN** the route is allowed through to the app (API ownership checks still apply)

#### Scenario: Post-login session not bounced by hook flicker
- **WHEN** a user has just completed login and `getSession()` has confirmed a session, but `useSession()` briefly reports null during client hydration
- **THEN** the client does not redirect that user back to `/login`

### Requirement: First-run admin bootstrap
When no users exist, the system SHALL present a first-run setup that creates the first account as admin using email and password.

#### Scenario: Empty database setup
- **WHEN** the application has zero users and a visitor completes first-run setup with email and password
- **THEN** that account is created with the admin role and can sign in

#### Scenario: Setup blocked after admin exists
- **WHEN** at least one user already exists
- **THEN** first-run account creation is not available and visitors are directed to login

### Requirement: Admin user management in settings
The system SHALL allow admin users, from Settings, to list users and create new users with email and password, while presenting the same primary notes UI as normal users.

#### Scenario: Admin creates a user
- **WHEN** an admin creates a user with email and password from Settings
- **THEN** the new user can log in and only access their own notes after configuring required credentials

#### Scenario: Non-admin cannot manage users
- **WHEN** a non-admin user opens Settings
- **THEN** user management controls are not available

### Requirement: Admin cannot access others' notes
The system SHALL enforce note ownership at the API boundary so admin role does not bypass user-scoped note queries.

#### Scenario: Admin requests another user's note by id
- **WHEN** an admin requests a practice note owned by another user
- **THEN** the system denies access as it would for any other non-owner

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

