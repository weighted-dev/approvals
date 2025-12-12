# weighted-approvals

Gerrit/Jenkins-style **weighted approvals** for GitHub Pull Requests, enforced via a **required Check Run**.

## What it does

You configure:
- **Weights** for users and/or teams (e.g. Alice is `+2`, most reviewers are `+1`)
- **Path-based rules** (CODEOWNERS-like glob patterns) that set the **required total** based on the files changed

Then this action computes:
- `required_total` (from the most strict matching rule, optionally overridden by a PR label like `wa:+3`)
- `current_total` (sum of weights from distinct reviewers whose **latest** review is `APPROVED`)

It creates/updates a Check Run named `weighted-approvals` (configurable). Make that check **required** in branch protection.

## Installation

### Quick start (self-test in this repo)

If you're developing this action, the fastest end-to-end test is using `uses: ./` (run the action from the same repo).

This repo already includes:
- `.github/weighted-approvals.yml` (test config)
- `.github/workflows/wa-test.yml` (workflow using `uses: ./`)

Steps:
1) Edit `.github/weighted-approvals.yml` and set real GitHub usernames/teams.
2) Push a branch and open a PR.
3) Approve / add labels / add `ma:` comment directives and watch the `weighted-approvals` check update.

### Using as a reusable action in another repo

1) Add config: `.github/weighted-approvals.yml`

Example:

```yaml
weights: {}
rules: []
```

See full examples in:
- [`examples/calcom/.github/weighted-approvals.yml`](examples/calcom/.github/weighted-approvals.yml)

2) Add workflow: `.github/workflows/weighted-approvals.yml`

See:
- [`examples/calcom/.github/workflows/weighted-approvals.yml`](examples/calcom/.github/workflows/weighted-approvals.yml)

3) Turn on branch protection

In your default branch protection rules, require the status check:
- `weighted-approvals`

## Configuration (`.github/weighted-approvals.yml`)

### `weights`

```yaml
weights:
  # Optional: default weight for ANY approving reviewer not explicitly listed below.
  # If set to 1, then "two +1 approvals can satisfy required_total=2".
  # Default is 1 (unlisted approvers contribute +1).
  default: 1
  # Optional: how to combine user weights vs team weights (default: max)
  # - max: use the higher of user/default and any matching team weight
  # - user: if user is explicitly listed, use that value and ignore teams
  # - team: if user matches any team, use the team value and ignore explicit user weight
  precedence: max
  users:
    alice: 2
    bob: 1
  teams:
    my-org/platform-reviewers: 2
    my-org/app-reviewers: 1
```

Notes:
- Team keys are `org/team_slug`.
- Team membership checks may require a token with **org read** permissions (often a PAT with `read:org`). If membership can't be checked, team weights will be ignored and the check output will tell you why.

### `rules`

Rules are evaluated against the PR's changed files. The **maximum** `required_total` among matching rules becomes the required threshold.

```yaml
rules:
  - paths:
      - "src/**"
    required_total: 2

  - paths:
      - "infra/**"
      - ".github/**"
    required_total: 3
```

### `approvers` - Control who can approve (optional)

Use the `approvers` block to control which teams/users can approve and whether you need approvals from ANY or ALL of them.

#### `any` - OR logic (any of these teams can approve)

```yaml
rules:
  - paths: ["infra/**"]
    required_total: 2
    approvers:
      any:
        my-org/infra-team: 1
        my-org/platform-team: 1
```

This means: approvals from `my-org/infra-team` OR `my-org/platform-team` count toward the required total of 2.

#### `all` - AND logic (need approval from each team)

```yaml
rules:
  - paths: ["apps/web/**"]
    required_total: 2
    approvers:
      all:
        my-org/frontend-team: 1
        my-org/foundation-team: 1
```

This means: you need at least 1 approval from `my-org/frontend-team` AND at least 1 from `my-org/foundation-team`.

#### Complex nested conditions

You can nest `any` and `all` for complex boolean logic like "(A AND B) OR C":

```yaml
rules:
  - paths: ["packages/critical/**"]
    required_total: 2
    approvers:
      any:
        - all:
            my-org/frontend-team: 1
            my-org/foundation-team: 1
        - all:
            my-org/admin-team: 2
```

This means: either (1 from frontend AND 1 from foundation) OR (2 from admin).

#### With explicit users

You can mix teams and users in complex conditions:

```yaml
rules:
  - paths: ["infra/**"]
    required_total: 2
    approvers:
      all:
        - teams:
            my-org/platform-team: 1
          users:
            alice: 1
```

#### No restriction (default)

When `approvers` is omitted, anyone can approve:

```yaml
rules:
  - paths: ["**"]
    required_total: 1
    # No approvers block - anyone can approve
```

### Label override (optional)

In the workflow you can configure a `label_prefix` (default `wa:+`). If a PR has a label like `wa:+3`, the required total becomes:

\( \max(required\_total\_from\_rules, 3) \)

### PR comment directive override (optional): `ma:@org/team +2`

You can also restrict "high weight" approvals per PR by adding a trusted comment like:

- `ma:@my-org/platform-reviewers +2`

Meaning:
- Only members of `my-org/platform-reviewers` may contribute **weight ≥ 2** on this PR.
- Everyone else is effectively capped to **at most 1**, even if they normally have +2 rights via another team/user weight.

Security:
- Only comments from trusted `author_association` values are honored (default: `OWNER,MEMBER,COLLABORATOR`). This prevents drive-by commenters from changing merge requirements.

## Example behavior

- **Rule requires 2**:
  - Alice (`+2`) approves ⇒ passes
  - Bob (`+1`) and Carol (`+1`) approve ⇒ passes
  - Only Bob (`+1`) approves ⇒ fails

## Security model

Recommended trigger depends on your goal:

- `pull_request`: works when the workflow exists only on a feature branch (useful for development/testing). For PRs from forks, permissions may be restricted.
- `pull_request_target`: more secure for enforcing rules on incoming PRs, but **the workflow must exist on the base branch** (e.g. `main`) to run.

This action loads the config from the **base branch ref** (not from the PR's head), so a PR can't lower requirements by editing the config file.

If you use the `ma:` PR comment directive feature, also trigger the workflow on `issue_comment` (created/edited/deleted) so the check updates when the directive comment changes.

## Limitations

- **YAML parsing**: this repo uses a small, dependency-free YAML subset parser. It supports common mappings/arrays/scalars, but not advanced YAML features (anchors, multiline blocks, etc.). Keep the config simple.
- **CODEOWNERS parity**: path patterns are "CODEOWNERS-ish" but not a byte-for-byte implementation.

## Inputs

- `token` (required): `GITHUB_TOKEN` or PAT
- `config_path` (default `.github/weighted-approvals.yml`)
- `check_name` (default `weighted-approvals`)
- `label_prefix` (default `wa:+`)
- `comment_directive_prefix` (default `ma:`): enables directives like `ma:@org/team +2`
- `comment_trusted_author_associations` (default `OWNER,MEMBER,COLLABORATOR`): who is allowed to set directives
- `fail_on_error` (default `true`)
- `debug` (default `false`)

## Development (TypeScript)

Source lives in `src/` and is written in TypeScript. The published GitHub Action runs `dist/index.js`.

- Build:

```bash
npm install
npm run build:all
```

- Commit `dist/` changes when releasing a new version/tag.

## Releasing

This action is published by pushing git tags. Consumers typically use the major tag:

- `uses: OWNER/weighted-approvals@v1`

Release steps:

```bash
npm install
./scripts/release.sh 1.2.3
# optionally:
./scripts/release.sh 1.2.3 --push
```

This will:
- update `package.json` / `package-lock.json`
- rebuild and commit `dist/index.js`
- create tags `v1.2.3` and move `v1`

## Replacing CODEOWNERS (example patterns)

### Single owner team

CODEOWNERS: `apps/api/** @my-org/api-team`

weighted-approvals:
```yaml
rules:
  - paths: ["apps/api/**"]
    required_total: 1
    approvers:
      any:
        my-org/api-team: 1
```

### Multiple owner teams (need one from each)

CODEOWNERS: `apps/web/** @my-org/frontend-team @my-org/foundation-team`

If you want "one approval from each owner team" (AND logic):

```yaml
rules:
  - paths: ["apps/web/**"]
    required_total: 2
    approvers:
      all:
        my-org/frontend-team: 1
        my-org/foundation-team: 1
```

### What happens when multiple rules match?

- **Required total**: we compute `required_total` as the **maximum** across all matching rules.
- **Allowed approvers**: if the max-required rule(s) have `approvers`, only users/teams mentioned in the condition can contribute weight.
- **Per-team requirements** (`all`): requirements are merged from the **max-required** matching rule(s) by taking the **max required count per team**. If any required team is missing, the check fails.
