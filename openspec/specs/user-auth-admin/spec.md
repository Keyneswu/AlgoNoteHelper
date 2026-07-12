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

