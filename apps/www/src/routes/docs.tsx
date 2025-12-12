import { createFileRoute, Link } from "@tanstack/react-router";
import { ShikiCode } from "../components/ShikiCode";
import {
  ChevronLeft,
  Users,
  FolderTree,
  GitMerge,
  Shield,
  Scale,
  Workflow,
} from "lucide-react";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

// Example configurations
const basicConfig = `# .github/weighted-approvals.yml
weights:
  users:
    alice: 2      # Senior developer
    bob: 1        # Developer
    carol: 1      # Developer

rules:
  - paths: ["**/*"]
    required_total: 2`;

const weightedTeamsConfig = `weights:
  users:
    alice: 2
    bob: 1
  teams:
    my-org/core-maintainers: 3    # Core team members get +3
    my-org/contributors: 1         # Contributors get +1

rules:
  - paths: ["**/*"]
    required_total: 2`;

const pathBasedConfig = `weights:
  users:
    alice: 2
    bob: 1
    carol: 1

rules:
  # Documentation - easy to approve
  - paths: ["docs/**", "*.md", "README*"]
    required_total: 1

  # Source code - standard review
  - paths: ["src/**", "lib/**"]
    required_total: 2

  # Infrastructure - requires senior approval
  - paths: ["infra/**", "terraform/**", ".github/**"]
    required_total: 3

  # Database migrations - extra careful
  - paths: ["migrations/**", "**/schema.prisma"]
    required_total: 4`;

const teamApproversConfig = `weights:
  teams:
    my-org/frontend: 2
    my-org/backend: 2
    my-org/security: 3

rules:
  # Frontend changes need frontend team
  - paths: ["apps/web/**", "packages/ui/**"]
    required_total: 2
    approvers:
      any:
        - my-org/frontend

  # Backend changes need backend team
  - paths: ["apps/api/**", "packages/core/**"]
    required_total: 2
    approvers:
      any:
        - my-org/backend

  # Security-sensitive files need security team
  - paths: ["**/auth/**", "**/crypto/**", ".env*"]
    required_total: 3
    approvers:
      all:
        - my-org/security`;

const andOrLogicConfig = `weights:
  teams:
    my-org/frontend: 2
    my-org/backend: 2
    my-org/devops: 2
    my-org/security: 3

rules:
  # Deployment configs need DevOps AND Security
  - paths: ["deploy/**", "k8s/**"]
    required_total: 4
    approvers:
      all:
        - my-org/devops
        - my-org/security

  # API changes need Frontend OR Backend
  - paths: ["packages/api-types/**"]
    required_total: 2
    approvers:
      any:
        - my-org/frontend
        - my-org/backend

  # Critical paths need multiple conditions
  - paths: ["apps/payments/**"]
    required_total: 5
    approvers:
      all:
        - my-org/security
      any:
        - my-org/backend
        - my-org/devops`;

const workflowBasic = `name: Weighted Approvals
on:
  pull_request_review:
    types: [submitted, dismissed]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: weighted-dev/approvals@v1
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}`;

const workflowAdvanced = `name: Weighted Approvals
on:
  pull_request_review:
    types: [submitted, dismissed]
  pull_request:
    types: [opened, synchronize, reopened]
  pull_request_target:
    types: [opened, synchronize, reopened]

jobs:
  check:
    runs-on: ubuntu-latest
    # Required for pull_request_target
    permissions:
      pull-requests: read
      checks: write
    steps:
      - uses: weighted-dev/approvals@v1
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          # Optional: custom config path
          config-path: .github/weighted-approvals.yml
          # Optional: fail open if config is missing
          fail-on-missing-config: false`;

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: "var(--color-accent-subtle)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: "var(--color-accent-fg)" }}
          />
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--color-fg-default)" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function CodeBlock({
  title,
  code,
  lang = "yaml",
}: {
  title: string;
  code: string;
  lang?: string;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden mb-6"
      style={{
        backgroundColor: "var(--color-canvas-subtle)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      <div
        className="px-4 py-2 border-b font-mono text-sm"
        style={{
          backgroundColor: "var(--color-canvas-inset)",
          borderColor: "var(--color-border-default)",
          color: "var(--color-fg-muted)",
        }}
      >
        {title}
      </div>
      <ShikiCode code={code} lang={lang} />
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="prose prose-invert max-w-none mb-6 text-base leading-relaxed"
      style={{ color: "var(--color-fg-muted)" }}
    >
      {children}
    </div>
  );
}

function DocsPage() {
  return (
    <main
      className="min-h-screen pt-20 pb-16"
      style={{ backgroundColor: "var(--color-canvas-default)" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm mb-8 transition-colors"
          style={{ color: "var(--color-fg-muted)" }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: "var(--color-fg-default)" }}
          >
            Documentation
          </h1>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-fg-muted)" }}
          >
            Learn how to configure weighted approvals for your repository. This
            guide covers everything from basic setup to advanced team-based
            approval workflows.
          </p>
        </div>

        {/* Table of Contents */}
        <nav
          className="p-4 rounded-lg mb-12"
          style={{
            backgroundColor: "var(--color-canvas-subtle)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <h3
            className="text-sm font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--color-fg-muted)" }}
          >
            On this page
          </h3>
          <ul className="space-y-2">
            {[
              { id: "quickstart", label: "Quick Start" },
              { id: "weights", label: "Configuring Weights" },
              { id: "rules", label: "Path-Based Rules" },
              { id: "approvers", label: "Team Approvers" },
              { id: "logic", label: "AND/OR Logic" },
              { id: "workflow", label: "GitHub Workflow" },
              { id: "examples", label: "Full Examples" },
            ].map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm transition-colors hover:underline"
                  style={{ color: "var(--color-accent-fg)" }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Quick Start */}
        <Section id="quickstart" title="Quick Start" icon={Workflow}>
          <Prose>
            <p>
              Getting started with weighted approvals takes just two files: a
              configuration file that defines your approval rules, and a GitHub
              Actions workflow that runs the check.
            </p>
          </Prose>

          <CodeBlock
            title=".github/weighted-approvals.yml"
            code={basicConfig}
          />

          <CodeBlock
            title=".github/workflows/approvals.yml"
            code={workflowBasic}
          />

          <Prose>
            <p>
              With this setup, Alice (weight +2) can approve PRs alone, while
              Bob and Carol (weight +1 each) need to both approve to reach the
              required total of 2.
            </p>
          </Prose>
        </Section>

        {/* Weights */}
        <Section id="weights" title="Configuring Weights" icon={Scale}>
          <Prose>
            <p>
              Weights determine how much each reviewer's approval counts toward
              the required total. You can assign weights to individual users and
              entire GitHub teams.
            </p>
          </Prose>

          <CodeBlock title="User and Team Weights" code={weightedTeamsConfig} />

          <div
            className="p-4 rounded-lg mb-6"
            style={{
              backgroundColor: "var(--color-attention-subtle)",
              border: "1px solid rgba(187, 128, 9, 0.4)",
            }}
          >
            <p
              className="text-sm"
              style={{ color: "var(--color-attention-fg)" }}
            >
              <strong>Note:</strong> Team weights apply to all members of that
              team. If a user is in multiple teams, they receive the highest
              weight from any team they belong to.
            </p>
          </div>

          <Prose>
            <p>Weight values are flexible:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>+1</strong> — Standard contributor
              </li>
              <li>
                <strong>+2</strong> — Senior developer or team lead
              </li>
              <li>
                <strong>+3</strong> — Core maintainer or architect
              </li>
              <li>
                <strong>Higher values</strong> — For critical approvers
              </li>
            </ul>
          </Prose>
        </Section>

        {/* Path-Based Rules */}
        <Section id="rules" title="Path-Based Rules" icon={FolderTree}>
          <Prose>
            <p>
              Different parts of your codebase can have different approval
              requirements. Use glob patterns to match file paths and set
              appropriate thresholds.
            </p>
          </Prose>

          <CodeBlock title="Path-Based Configuration" code={pathBasedConfig} />

          <Prose>
            <p>
              Rules are evaluated in order, and the <strong>highest</strong>{" "}
              required_total from any matching rule is used. This means if a PR
              touches both <code>docs/</code> and <code>infra/</code>, it will
              require 3 approvals (the higher threshold).
            </p>
          </Prose>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "var(--color-success-subtle)",
              border: "1px solid rgba(46, 160, 67, 0.4)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-success-fg)" }}>
              <strong>Tip:</strong> Use specific paths for sensitive areas like{" "}
              <code>migrations/**</code> or <code>.github/**</code> to require
              extra scrutiny on changes that could break production.
            </p>
          </div>
        </Section>

        {/* Team Approvers */}
        <Section id="approvers" title="Team Approvers" icon={Users}>
          <Prose>
            <p>
              Beyond just counting approval weights, you can require that
              specific teams must approve certain changes. This ensures the
              right people review the right code.
            </p>
          </Prose>

          <CodeBlock title="Team-Based Approvers" code={teamApproversConfig} />

          <Prose>
            <p>
              The <code>approvers</code> field specifies which teams must be
              involved in the approval:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <code>any</code> — At least one member from any listed team must
                approve
              </li>
              <li>
                <code>all</code> — At least one member from every listed team
                must approve
              </li>
            </ul>
          </Prose>
        </Section>

        {/* AND/OR Logic */}
        <Section id="logic" title="AND/OR Logic" icon={GitMerge}>
          <Prose>
            <p>
              For complex approval workflows, you can combine <code>all</code>{" "}
              and <code>any</code> requirements in the same rule. This gives you
              fine-grained control over who must approve different types of
              changes.
            </p>
          </Prose>

          <CodeBlock title="Combined AND/OR Logic" code={andOrLogicConfig} />

          <Prose>
            <p>In the example above:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Deployment configs</strong> require approval from{" "}
                <em>both</em> DevOps AND Security teams
              </li>
              <li>
                <strong>API type changes</strong> require approval from{" "}
                <em>either</em> Frontend OR Backend teams
              </li>
              <li>
                <strong>Payment code</strong> requires Security AND (Backend OR
                DevOps) — combining both conditions
              </li>
            </ul>
          </Prose>
        </Section>

        {/* Workflow */}
        <Section id="workflow" title="GitHub Workflow" icon={Shield}>
          <Prose>
            <p>
              The GitHub Actions workflow runs the weighted approvals check on
              your pull requests. Here's a basic and an advanced configuration.
            </p>
          </Prose>

          <CodeBlock title="Basic Workflow" code={workflowBasic} />

          <Prose>
            <p>
              For repositories with stricter security requirements or forks, you
              may want the advanced configuration:
            </p>
          </Prose>

          <CodeBlock title="Advanced Workflow" code={workflowAdvanced} />

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "var(--color-accent-subtle)",
              border: "1px solid rgba(56, 139, 253, 0.4)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-accent-fg)" }}>
              <strong>Important:</strong> The action creates a Check Run that
              can be required in branch protection rules. Go to Settings →
              Branches → Branch protection rules and add "Weighted Approvals" as
              a required status check.
            </p>
          </div>
        </Section>

        {/* Full Examples */}
        <Section id="examples" title="Full Examples" icon={FolderTree}>
          <Prose>
            <p>
              Here are complete configurations for common scenarios you might
              encounter.
            </p>
          </Prose>

          <h3
            className="text-lg font-semibold mb-4 mt-8"
            style={{ color: "var(--color-fg-default)" }}
          >
            Open Source Project
          </h3>
          <CodeBlock
            title=".github/weighted-approvals.yml"
            code={`# Open source project with maintainers and contributors
weights:
  users:
    # Core maintainers
    lead-maintainer: 3
    co-maintainer: 2
  teams:
    my-org/maintainers: 2
    my-org/contributors: 1

rules:
  # Most changes need 2 points
  - paths: ["**/*"]
    required_total: 2

  # Release and CI config needs maintainer
  - paths: [".github/**", "release.config.*"]
    required_total: 2
    approvers:
      any:
        - my-org/maintainers

  # Package publishing needs lead
  - paths: ["package.json", "pnpm-lock.yaml"]
    required_total: 3`}
          />

          <h3
            className="text-lg font-semibold mb-4 mt-8"
            style={{ color: "var(--color-fg-default)" }}
          >
            Enterprise Monorepo
          </h3>
          <CodeBlock
            title=".github/weighted-approvals.yml"
            code={`# Enterprise monorepo with multiple teams
weights:
  teams:
    acme/platform: 2
    acme/frontend: 2
    acme/backend: 2
    acme/mobile: 2
    acme/security: 3
    acme/sre: 3

rules:
  # Shared packages need platform team
  - paths: ["packages/shared/**", "packages/utils/**"]
    required_total: 2
    approvers:
      any:
        - acme/platform

  # Frontend apps
  - paths: ["apps/web/**", "apps/dashboard/**"]
    required_total: 2
    approvers:
      any:
        - acme/frontend

  # Backend services
  - paths: ["services/**", "apps/api/**"]
    required_total: 2
    approvers:
      any:
        - acme/backend

  # Mobile apps
  - paths: ["apps/ios/**", "apps/android/**"]
    required_total: 2
    approvers:
      any:
        - acme/mobile

  # Infrastructure requires SRE + Security
  - paths: ["infra/**", "terraform/**", "k8s/**"]
    required_total: 4
    approvers:
      all:
        - acme/sre
        - acme/security

  # Security-sensitive code
  - paths: ["**/auth/**", "**/crypto/**", "**/secrets/**"]
    required_total: 3
    approvers:
      all:
        - acme/security`}
          />

          <h3
            className="text-lg font-semibold mb-4 mt-8"
            style={{ color: "var(--color-fg-default)" }}
          >
            Small Team
          </h3>
          <CodeBlock
            title=".github/weighted-approvals.yml"
            code={`# Small team with simple rules
weights:
  users:
    alice: 2    # Tech lead
    bob: 2      # Senior dev
    carol: 1    # Developer
    dave: 1     # Developer

rules:
  # Standard code review
  - paths: ["src/**", "lib/**"]
    required_total: 2

  # Config files need senior
  - paths: ["*.config.*", ".env*"]
    required_total: 2

  # Docs are easy
  - paths: ["docs/**", "*.md"]
    required_total: 1`}
          />
        </Section>

        {/* Footer */}
        <div
          className="mt-16 pt-8 border-t text-center"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-fg-subtle)" }}>
            Need help?{" "}
            <a
              href="https://github.com/weighted-dev/approvals/issues"
              className="hover:underline"
              style={{ color: "var(--color-accent-fg)" }}
            >
              Open an issue on GitHub
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
