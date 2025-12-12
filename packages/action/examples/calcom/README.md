# Cal.com CODEOWNERS-style example

This folder shows how you can replace a CODEOWNERS-like setup with `weighted-approvals`.

## The `approvers` syntax

Use the `approvers` block to control which teams/users can approve and whether you need approvals from ANY or ALL of them.

### `any` - OR logic (any of these teams can approve)

```yaml
approvers:
  any:
    calcom/api: 1
    calcom/platform: 1
```

This means: approvals from `calcom/api` OR `calcom/platform` count toward the required total.

### `all` - AND logic (need approval from each team)

```yaml
approvers:
  all:
    calcom/consumer: 1
    calcom/foundation: 1
```

This means: you need at least 1 approval from `calcom/consumer` AND at least 1 from `calcom/foundation`.

### Complex nested conditions

You can nest `any` and `all` for complex logic like "(A AND B) OR C":

```yaml
approvers:
  any:
    - all:
        calcom/consumer: 1
        calcom/foundation: 1
    - all:
        calcom/admin: 2
```

This means: either (1 from consumer AND 1 from foundation) OR (2 from admin).

## Key mapping from CODEOWNERS

- **Single owner team** (e.g. `@calcom/Foundation`) becomes:
  ```yaml
  required_total: 1
  approvers:
    any:
      calcom/foundation: 1
  ```

- **Multiple owner teams with AND logic** (e.g. need one from each of `@calcom/Consumer` and `@calcom/Foundation`) becomes:
  ```yaml
  required_total: 2
  approvers:
    all:
      calcom/consumer: 1
      calcom/foundation: 1
  ```

- **No restriction** (anyone can approve):
  ```yaml
  required_total: 1
  # No approvers block - anyone can approve
  ```

## Files

- `.github/weighted-approvals.yml`: example config
- `.github/workflows/weighted-approvals.yml`: example workflow
