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

If you’re developing this action, the fastest end-to-end test is using `uses: ./` (run the action from the same repo).

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
- [`examples/.github/weighted-approvals.yml`](examples/.github/weighted-approvals.yml)

2) Add workflow: `.github/workflows/weighted-approvals.yml`

See:
- [`examples/.github/workflows/weighted-approvals.yml`](examples/.github/workflows/weighted-approvals.yml)

3) Turn on branch protection

In your default branch protection rules, require the status check:
- `weighted-approvals`

## Configuration (`.github/weighted-approvals.yml`)

### `weights`

```yaml
weights:
  # Optional: default weight for ANY approving reviewer not explicitly listed below.
  # If set to 1, then “two +1 approvals can satisfy required_total=2”.
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
- Team membership checks may require a token with **org read** permissions (often a PAT with `read:org`). If membership can’t be checked, team weights will be ignored and the check output will tell you why.

### `rules`

Rules are evaluated against the PR’s changed files. The **maximum** `required_total` among matching rules becomes the required threshold.

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

#### Restrict who can satisfy the max rule (optional)

If the rule(s) that set the **max** required total have an `allowed` section, only those users/teams can contribute weight toward meeting the requirement.

```yaml
rules:
  - paths:
      - "infra/**"
    required_total: 3
    allowed:
      users:
        - alice
      teams:
        - my-org/platform-reviewers
```

### Label override (optional)

In the workflow you can configure a `label_prefix` (default `wa:+`). If a PR has a label like `wa:+3`, the required total becomes:

\( \max(required\_total\_from\_rules, 3) \)

### PR comment directive override (optional): `ma:@org/team +2`

You can also restrict “high weight” approvals per PR by adding a trusted comment like:

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

This action loads the config from the **base branch ref** (not from the PR’s head), so a PR can’t lower requirements by editing the config file.

If you use the `ma:` PR comment directive feature, also trigger the workflow on `issue_comment` (created/edited/deleted) so the check updates when the directive comment changes.

## Limitations

- **YAML parsing**: this repo uses a small, dependency-free YAML subset parser. It supports common mappings/arrays/scalars, but not advanced YAML features (anchors, multiline blocks, etc.). Keep the config simple.
- **CODEOWNERS parity**: path patterns are “CODEOWNERS-ish” but not a byte-for-byte implementation.

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


