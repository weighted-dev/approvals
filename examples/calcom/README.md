# Cal.com CODEOWNERS-style example

This folder shows how you can replace a CODEOWNERS-like setup with `weighted-approvals`.

## Key mapping

- **Single owner team** (e.g. `@calcom/Foundation`) becomes:
  - `required_total: 1`
  - `allowed.teams: ["calcom/foundation"]`

- **Multiple owner teams** (e.g. `@calcom/Consumer @calcom/Foundation`) becomes:
  - `required_total: 2`
  - `allowed.teams: ["calcom/consumer", "calcom/foundation"]`
  - `required_by.teams` to enforce **one from each team**:
    - `calcom/consumer: 1`
    - `calcom/foundation: 1`

## Files

- `.github/weighted-approvals.yml`: example config
- `.github/workflows/weighted-approvals.yml`: example workflow


