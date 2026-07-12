# user-llm-config Specification

## Purpose
TBD - created by archiving change init-algonote-helper. Update Purpose after archive.
## Requirements
### Requirement: Separate chat and embedding configurations
The system SHALL store per-user Chat and Embedding configurations separately, each including API key and selectable model (and provider/base URL as needed).

#### Scenario: Save distinct models
- **WHEN** a user saves a DeepSeek chat model with chat key and a Bailian embedding model with embedding key
- **THEN** the system persists both configurations independently for that user

### Requirement: Verify connection before trusting keys
The system SHALL provide a verify-connection action for chat and for embedding that performs a minimal live request and reports success or failure before treating the configuration as ready for AI features that depend on it.

#### Scenario: Successful chat verification
- **WHEN** the user submits a valid chat API key and model and runs verify
- **THEN** the system reports success and marks chat configuration as verified

#### Scenario: Failed embedding verification
- **WHEN** the user submits an invalid embedding API key and runs verify
- **THEN** the system reports failure and does not mark embedding as verified

### Requirement: First-time and settings configuration UX
The system SHALL require users to configure and verify needed API keys when first using the app (first-run for admin includes this step; other users are prompted on first login if missing), and SHALL allow later changes from Settings.

#### Scenario: New user missing keys
- **WHEN** a newly created user logs in without chat/embedding configuration
- **THEN** the system prompts them to configure and verify keys before using AI-dependent features

### Requirement: Secret redaction
The system SHALL NOT return full API key values to the client after save; read APIs MUST return redacted hints only.

#### Scenario: Load settings after save
- **WHEN** a user reloads Settings after saving API keys
- **THEN** the UI shows redacted key hints rather than the full secrets

