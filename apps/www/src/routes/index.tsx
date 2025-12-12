import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  FolderTree,
  GitMerge,
  Copy,
  Check,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { WeightedApprovalDemo } from "../components/WeightedApprovalDemo";
import { ShikiCode } from "../components/ShikiCode";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded transition-colors"
      style={{ color: "var(--color-fg-muted)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.color = "var(--color-fg-default)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "var(--color-fg-muted)")
      }
    >
      {copied ? (
        <Check
          className="w-4 h-4"
          style={{ color: "var(--color-success-fg)" }}
        />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4">
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: "var(--color-canvas-subtle)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <Icon className="w-5 h-5" style={{ color: "var(--color-fg-muted)" }} />
      </div>
      <div>
        <h3
          className="font-semibold text-base mb-1"
          style={{ color: "var(--color-fg-default)" }}
        >
          {title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-fg-muted)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

const configExample = `weights:
  users:
    alice: 2    # Senior dev - can approve alone
    bob: 1      # Regular dev
  teams:
    my-org/platform: 2

rules:
  - paths: ["src/**"]
    required_total: 2

  - paths: ["infra/**"]
    required_total: 3
    approvers:
      any:
        my-org/platform: 1
        my-org/sre: 1`;

const workflowExample = `name: Weighted Approvals
on:
  pull_request_review:
    types: [submitted, dismissed]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: weighted-dev/approvals@v1`;

function LandingPage() {
  return (
    <main style={{ backgroundColor: "var(--color-canvas-default)" }}>
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "var(--color-success-subtle)",
                color: "var(--color-success-fg)",
              }}
            >
              <Terminal className="w-4 h-4" />
              GitHub Action
            </div>
          </div>

          {/* Main heading */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-6 tracking-tight"
            style={{ color: "var(--color-fg-default)" }}
          >
            Weighted Approvals
          </h1>

          <p
            className="text-lg sm:text-xl text-center max-w-2xl mx-auto mb-8 leading-relaxed"
            style={{ color: "var(--color-fg-muted)" }}
          >
            Gerrit-style weighted code reviews for GitHub. Assign reviewer
            weights, configure path-based rules, and enforce via Check Runs.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              to="/docs"
              className="btn-primary flex items-center gap-2"
              style={{ padding: "10px 20px", fontSize: "16px" }}
            >
              Get started
            </Link>
            <a
              href="https://github.com/weighted-dev/approvals"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
              style={{ padding: "10px 20px", fontSize: "16px" }}
            >
              Star on GitHub
            </a>
          </div>

          {/* Demo */}
          <WeightedApprovalDemo />
        </div>
      </section>

      {/* How it works - simple steps */}
      <section
        id="how-it-works"
        className="py-16 border-t"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-4"
            style={{ color: "var(--color-fg-default)" }}
          >
            How it works
          </h2>
          <p
            className="text-center mb-12 max-w-xl mx-auto"
            style={{ color: "var(--color-fg-muted)" }}
          >
            A straightforward flow that gives you precise control over PR
            approvals
          </p>

          {/* Steps as a horizontal timeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "PR Created",
                desc: "Changed files detected",
              },
              {
                step: "2",
                title: "Rules Match",
                desc: "Path patterns evaluated",
              },
              {
                step: "3",
                title: "Weights Sum",
                desc: "Reviewer weights tallied",
              },
              { step: "4", title: "Check Result", desc: "Pass/fail reported" },
            ].map((item, i) => (
              <div key={item.step} className="text-center relative">
                {/* Connector line */}
                {i < 3 && (
                  <div
                    className="hidden md:block absolute top-5 left-[60%] w-[80%] h-0.5"
                    style={{ backgroundColor: "var(--color-border-default)" }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 relative z-10 text-sm font-bold"
                  style={{
                    backgroundColor: "var(--color-canvas-subtle)",
                    border: "2px solid var(--color-border-default)",
                    color: "var(--color-fg-default)",
                  }}
                >
                  {item.step}
                </div>
                <h3
                  className="font-semibold mb-1"
                  style={{ color: "var(--color-fg-default)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-16 border-t"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-4"
            style={{ color: "var(--color-fg-default)" }}
          >
            Features
          </h2>
          <p
            className="text-center mb-12 max-w-xl mx-auto"
            style={{ color: "var(--color-fg-muted)" }}
          >
            Everything you need for sophisticated code review workflows
          </p>

          <div
            className="grid md:grid-cols-3 gap-px max-w-4xl mx-auto rounded-lg overflow-hidden"
            style={{ backgroundColor: "var(--color-border-default)" }}
          >
            <div style={{ backgroundColor: "var(--color-canvas-subtle)" }}>
              <FeatureItem
                icon={Users}
                title="Weighted Reviewers"
                description="Senior devs with +2 can approve alone, or two +1 reviewers can combine their weights."
              />
            </div>
            <div style={{ backgroundColor: "var(--color-canvas-subtle)" }}>
              <FeatureItem
                icon={FolderTree}
                title="Path-Based Rules"
                description="Critical infrastructure can require +3 approval, while docs only need +1."
              />
            </div>
            <div style={{ backgroundColor: "var(--color-canvas-subtle)" }}>
              <FeatureItem
                icon={GitMerge}
                title="Team Logic"
                description="Use AND/OR logic. Require frontend AND backend teams, or any platform member."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Configuration example */}
      <section
        id="config"
        className="py-16 border-t"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-4"
            style={{ color: "var(--color-fg-default)" }}
          >
            Simple configuration
          </h2>
          <p
            className="text-center mb-12 max-w-xl mx-auto"
            style={{ color: "var(--color-fg-muted)" }}
          >
            Add a YAML file to your repo and a workflow — that's it
          </p>

          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Config file */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: "var(--color-canvas-subtle)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-2 border-b"
                style={{
                  backgroundColor: "var(--color-canvas-inset)",
                  borderColor: "var(--color-border-default)",
                }}
              >
                <span
                  className="font-mono text-sm"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  .github/weighted-approvals.yml
                </span>
                <CopyButton text={configExample} />
              </div>
              <ShikiCode code={configExample} lang="yaml" />
            </div>

            {/* Workflow file */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: "var(--color-canvas-subtle)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-2 border-b"
                style={{
                  backgroundColor: "var(--color-canvas-inset)",
                  borderColor: "var(--color-border-default)",
                }}
              >
                <span
                  className="font-mono text-sm"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  .github/workflows/approvals.yml
                </span>
                <CopyButton text={workflowExample} />
              </div>
              <ShikiCode code={workflowExample} lang="yaml" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 border-t"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-4"
            style={{ color: "var(--color-fg-default)" }}
          >
            Ready to get started?
          </h2>
          <p className="mb-8" style={{ color: "var(--color-fg-muted)" }}>
            Add weighted approvals to your repository in minutes.
          </p>
          <Link
            to="/docs"
            className="btn-primary inline-flex items-center gap-2"
            style={{ padding: "12px 24px", fontSize: "16px" }}
          >
            Read the docs
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 border-t"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-fg-subtle)" }}>
            MIT License · Made with ❤️ by{" "}
            <a
              href="https://github.com/weighted-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--color-fg-muted)" }}
            >
              weighted-dev
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
