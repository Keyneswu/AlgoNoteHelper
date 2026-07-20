## MODIFIED Requirements

### Requirement: Validated field-operation contract
The system SHALL validate the rewrite field and operation as an allowed combination before calling the model and SHALL reject unsupported combinations. Allowed combinations are statement `format_markdown` and approach `organize` only.

#### Scenario: Invoke a supported operation
- **WHEN** a request targets statement formatting or approach organization
- **THEN** the system applies the corresponding server-owned field policy

#### Scenario: Request generic code rewrite
- **WHEN** a client requests generic prose rewrite behavior for the code field
- **THEN** the system rejects the request without calling the model

#### Scenario: Request an invalid combination
- **WHEN** a client sends an operation that is not allowed for its target field (including custom, pitfall, or generate-approach style requests)
- **THEN** the system returns a validation error without calling the model

### Requirement: Field-specific rewrite semantics
The system SHALL use distinct server-owned rewrite policies for problem statements and existing approaches and SHALL provide only context relevant to grounding the selected target. The system MUST NOT expose pitfall rewrite operations or approach generation through the rewrite API.

#### Scenario: Organize an existing approach
- **WHEN** the user invokes Organize approach for non-empty approach content
- **THEN** the model reorganizes that existing approach using the note context without silently replacing it with an unrelated algorithm

#### Scenario: Format a problem statement remains available
- **WHEN** the user invokes Format for a non-empty problem statement
- **THEN** the system returns a statement candidate associated with that field and leaves the current draft unchanged until the user applies it

## ADDED Requirements

### Requirement: Pending indicator for rewrite actions
While a rewrite request is in flight, the system SHALL show a visible spinning pending indicator on or beside the invoked action control and MUST disable concurrent rewrite actions for that panel until the request completes or fails.

#### Scenario: Spinner while formatting
- **WHEN** the user invokes Format and the rewrite request has not yet returned
- **THEN** the Format control shows a spinning pending indicator and other rewrite actions in that panel are disabled

## REMOVED Requirements

### Requirement: Prompted rewrite
**Reason**: Custom instruction rewrite is unused and adds UI/API complexity the owner does not want.
**Migration**: Clients must stop sending `operation: "custom"`; use `format_markdown` or `organize` instead. Delete custom rewrite UI and reject `custom` on the server.
