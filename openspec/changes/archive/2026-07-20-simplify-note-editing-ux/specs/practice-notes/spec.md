## MODIFIED Requirements

### Requirement: Ordered single-line pitfalls
The note creation and detail editing experiences SHALL treat pitfalls as an ordered list of non-empty strings that MAY contain internal line breaks, and SHALL submit that list through the existing pitfalls array. Normalization MUST trim items and drop blanks but MUST NOT split one item into multiple items on newline characters.

#### Scenario: Persist independent pitfall items
- **WHEN** the owner saves multiple pitfall blocks including items that contain line breaks
- **THEN** subsequent retrieval returns the same non-empty items in the same order with internal line breaks preserved

#### Scenario: Normalize without splitting lines
- **WHEN** pitfall input for one item contains line breaks in the creation or detail editing experience
- **THEN** the client keeps those line breaks inside that single ordered pitfall item before persistence

#### Scenario: Preserve existing array compatibility
- **WHEN** import, merge, embedding, or Ask grounding consumes a saved note
- **THEN** pitfalls remain available through the existing string-array field without a schema migration
