import { useState, useEffect } from "react";
import {
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  GitPullRequest,
  FileCode,
  Play,
  FileText,
} from "lucide-react";
import { ShikiCode } from "./ShikiCode";

interface Reviewer {
  login: string;
  weight: number;
  state: "pending" | "approved" | "changes_requested";
}

interface CheckStep {
  name: string;
  status: "success" | "pending" | "running" | "queued";
  duration?: string;
}

const initialReviewers: Reviewer[] = [
  { login: "alice", weight: 2, state: "pending" },
  { login: "bob", weight: 1, state: "pending" },
  { login: "carol", weight: 1, state: "pending" },
];

const changedFiles = [
  { name: "src/components/Button.tsx", additions: 24, deletions: 8 },
  { name: "src/utils/api.ts", additions: 12, deletions: 3 },
  { name: "infra/terraform/main.tf", additions: 45, deletions: 12 },
];

const configYaml = `weights:
  users:
    alice: 2    # Senior dev - can approve alone
    bob: 1      # Regular dev
    carol: 1    # Regular dev
  teams:
    my-org/platform: 2

rules:
  - paths: ["src/**"]
    required_total: 2

  - paths: ["infra/**"]
    required_total: 3
    approvers:
      any:
        - my-org/platform
        - my-org/sre`;

const workflowYaml = `name: Weighted Approvals
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

type TabId = "demo" | "config" | "workflow";

export function WeightedApprovalDemo() {
  const [reviewers, setReviewers] = useState<Reviewer[]>(initialReviewers);
  const [expanded, setExpanded] = useState(true);
  const [, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("demo");
  const requiredTotal = 3;

  const approvedWeight = reviewers
    .filter((r) => r.state === "approved")
    .reduce((sum, r) => sum + r.weight, 0);

  const isPassing = approvedWeight >= requiredTotal;

  const checkSteps: CheckStep[] = [
    { name: "Set up job", status: "success", duration: "1s" },
    { name: "Checkout repository", status: "success", duration: "3s" },
    { name: "Load configuration", status: "success", duration: "0s" },
    {
      name: "Evaluate approval rules",
      status: isPassing ? "success" : "running",
      duration: isPassing ? "0s" : undefined,
    },
    {
      name: "Post check status",
      status: isPassing ? "success" : "queued",
      duration: isPassing ? "1s" : undefined,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next === 2) {
          setReviewers((r) =>
            r.map((reviewer) =>
              reviewer.login === "alice"
                ? { ...reviewer, state: "approved" }
                : reviewer
            )
          );
        }
        if (next === 4) {
          setReviewers((r) =>
            r.map((reviewer) =>
              reviewer.login === "bob"
                ? { ...reviewer, state: "approved" }
                : reviewer
            )
          );
        }
        if (next === 7) {
          setReviewers(initialReviewers);
          return 0;
        }
        return next;
      });
    }, 1400);

    return () => clearInterval(timer);
  }, []);

  const tabs: { id: TabId; label: string; icon: typeof Play }[] = [
    { id: "demo", label: "Live Demo", icon: Play },
    { id: "config", label: "weighted-approvals.yml", icon: FileText },
    { id: "workflow", label: "workflow.yml", icon: FileCode },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div
        className="flex border-b"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative"
              style={{
                color: isActive
                  ? "var(--color-fg-default)"
                  : "var(--color-fg-muted)",
                backgroundColor: isActive
                  ? "var(--color-canvas-subtle)"
                  : "transparent",
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: "var(--color-attention-emphasis)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        className="border border-t-0 rounded-b-md overflow-hidden"
        style={{
          backgroundColor: "var(--color-canvas-subtle)",
          borderColor: "var(--color-border-default)",
        }}
      >
        {activeTab === "demo" && (
          <DemoContent
            reviewers={reviewers}
            expanded={expanded}
            setExpanded={setExpanded}
            isPassing={isPassing}
            approvedWeight={approvedWeight}
            requiredTotal={requiredTotal}
            checkSteps={checkSteps}
          />
        )}

        {activeTab === "config" && (
          <div className="relative">
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
            </div>
            <ShikiCode code={configYaml} lang="yaml" />
          </div>
        )}

        {activeTab === "workflow" && (
          <div className="relative">
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
            </div>
            <ShikiCode code={workflowYaml} lang="yaml" />
          </div>
        )}
      </div>
    </div>
  );
}

// Demo content component
function DemoContent({
  reviewers,
  expanded,
  setExpanded,
  isPassing,
  approvedWeight,
  requiredTotal,
  checkSteps,
}: {
  reviewers: Reviewer[];
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  isPassing: boolean;
  approvedWeight: number;
  requiredTotal: number;
  checkSteps: CheckStep[];
}) {
  return (
    <>
      {/* Workflow header - mimics GitHub Actions */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{
          backgroundColor: "var(--color-canvas-inset)",
          borderColor: "var(--color-border-default)",
        }}
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            isPassing ? "" : "pulse-pending"
          }`}
          style={{
            backgroundColor: isPassing
              ? "var(--color-success-emphasis)"
              : "var(--color-attention-emphasis)",
          }}
        >
          {isPassing ? (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          ) : (
            <Clock className="w-3 h-3 text-white" strokeWidth={2.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-sm truncate"
              style={{ color: "var(--color-fg-default)" }}
            >
              Weighted Approvals
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isPassing
                  ? "var(--color-success-subtle)"
                  : "var(--color-attention-subtle)",
                color: isPassing
                  ? "var(--color-success-fg)"
                  : "var(--color-attention-fg)",
              }}
            >
              {isPassing ? "Passing" : "In progress"}
            </span>
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--color-fg-muted)" }}
          >
            pull_request_review · triggered 2m ago
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-md hover:opacity-80 transition-opacity"
          style={{ color: "var(--color-fg-muted)" }}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col lg:flex-row">
          {/* Left panel - Job steps */}
          <div
            className="lg:w-72 border-b lg:border-b-0 lg:border-r flex-shrink-0"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <div
              className="px-4 py-2 text-xs font-medium border-b"
              style={{
                color: "var(--color-fg-muted)",
                borderColor: "var(--color-border-muted)",
                backgroundColor: "rgba(0,0,0,0.1)",
              }}
            >
              Jobs
            </div>
            <div className="p-2">
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                style={{ backgroundColor: "var(--color-accent-subtle)" }}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isPassing ? "" : "pulse-pending"
                  }`}
                  style={{
                    backgroundColor: isPassing
                      ? "var(--color-success-emphasis)"
                      : "var(--color-attention-emphasis)",
                  }}
                >
                  {isPassing ? (
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  ) : (
                    <Clock
                      className="w-2.5 h-2.5 text-white"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--color-fg-default)" }}
                >
                  evaluate-approvals
                </span>
              </div>
            </div>

            {/* Steps list */}
            <div
              className="border-t"
              style={{ borderColor: "var(--color-border-muted)" }}
            >
              {checkSteps.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm"
                  style={{
                    color:
                      s.status === "queued"
                        ? "var(--color-fg-subtle)"
                        : "var(--color-fg-default)",
                  }}
                >
                  {s.status === "success" && (
                    <Check
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "var(--color-success-fg)" }}
                      strokeWidth={2}
                    />
                  )}
                  {s.status === "running" && (
                    <div
                      className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                      style={{ borderColor: "var(--color-attention-fg)" }}
                    />
                  )}
                  {s.status === "queued" && (
                    <div
                      className="w-4 h-4 rounded-full border flex-shrink-0"
                      style={{ borderColor: "var(--color-border-default)" }}
                    />
                  )}
                  <span className="truncate flex-1">{s.name}</span>
                  {s.duration && (
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--color-fg-subtle)" }}
                    >
                      {s.duration}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel - Check details */}
          <div className="flex-1 min-w-0">
            {/* PR Info */}
            <div
              className="px-4 py-3 border-b flex items-center gap-3"
              style={{
                borderColor: "var(--color-border-muted)",
                backgroundColor: "rgba(0,0,0,0.1)",
              }}
            >
              <GitPullRequest
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "var(--color-success-fg)" }}
              />
              <div className="min-w-0 flex-1">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-fg-default)" }}
                >
                  feat: add weighted approval support
                </span>
                <span
                  className="text-sm ml-2"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  #42
                </span>
              </div>
            </div>

            {/* Matched rule */}
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: "var(--color-border-muted)" }}
            >
              <div
                className="text-xs font-medium mb-2 uppercase tracking-wide"
                style={{ color: "var(--color-fg-muted)" }}
              >
                Matched Rule
              </div>
              <div
                className="font-mono text-sm rounded-md p-3 flex items-center gap-2 flex-wrap"
                style={{
                  backgroundColor: "var(--color-canvas-inset)",
                  border: "1px solid var(--color-border-muted)",
                }}
              >
                <span style={{ color: "var(--color-accent-fg)" }}>paths:</span>
                <span style={{ color: "var(--color-fg-default)" }}>
                  ["infra/**"]
                </span>
                <span style={{ color: "var(--color-fg-subtle)" }}>→</span>
                <span style={{ color: "var(--color-success-fg)" }}>
                  required: {requiredTotal}
                </span>
              </div>
            </div>

            {/* Changed files */}
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: "var(--color-border-muted)" }}
            >
              <div
                className="text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-2"
                style={{ color: "var(--color-fg-muted)" }}
              >
                <FileCode className="w-3.5 h-3.5" />
                Changed Files
              </div>
              <div
                className="rounded-md overflow-hidden border"
                style={{ borderColor: "var(--color-border-muted)" }}
              >
                {changedFiles.map((file, idx) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-mono border-b last:border-b-0"
                    style={{
                      backgroundColor:
                        idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.1)",
                      borderColor: "var(--color-border-muted)",
                    }}
                  >
                    <span
                      className="flex-1 truncate"
                      style={{ color: "var(--color-fg-default)" }}
                    >
                      {file.name}
                    </span>
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--color-success-fg)" }}
                    >
                      +{file.additions}
                    </span>
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--color-danger-fg)" }}
                    >
                      −{file.deletions}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviewers / Approvals */}
            <div className="px-4 py-3">
              <div
                className="text-xs font-medium mb-2 uppercase tracking-wide"
                style={{ color: "var(--color-fg-muted)" }}
              >
                Approvals ({approvedWeight}/{requiredTotal})
              </div>
              <div className="space-y-2">
                {reviewers.map((reviewer) => (
                  <div
                    key={reviewer.login}
                    className="flex items-center gap-3 p-2 rounded-md transition-colors"
                    style={{
                      backgroundColor:
                        reviewer.state === "approved"
                          ? "var(--color-success-subtle)"
                          : "transparent",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{
                        backgroundColor:
                          reviewer.state === "approved"
                            ? "var(--color-success-emphasis)"
                            : "var(--color-canvas-overlay)",
                        color:
                          reviewer.state === "approved"
                            ? "#fff"
                            : "var(--color-fg-muted)",
                        border:
                          reviewer.state === "approved"
                            ? "none"
                            : "1px solid var(--color-border-default)",
                      }}
                    >
                      {reviewer.login[0].toUpperCase()}
                    </div>
                    {/* Name and weight */}
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--color-fg-default)" }}
                      >
                        @{reviewer.login}
                      </span>
                      <span
                        className="text-xs ml-2"
                        style={{ color: "var(--color-fg-subtle)" }}
                      >
                        weight: +{reviewer.weight}
                      </span>
                    </div>
                    {/* Status */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {reviewer.state === "approved" ? (
                        <>
                          <Check
                            className="w-4 h-4"
                            style={{ color: "var(--color-success-fg)" }}
                            strokeWidth={2.5}
                          />
                          <span
                            className="text-xs font-medium"
                            style={{ color: "var(--color-success-fg)" }}
                          >
                            Approved
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock
                            className="w-4 h-4"
                            style={{ color: "var(--color-fg-subtle)" }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: "var(--color-fg-subtle)" }}
                          >
                            Pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-canvas-inset)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((approvedWeight / requiredTotal) * 100, 100)}%`,
                      backgroundColor: isPassing
                        ? "var(--color-success-emphasis)"
                        : "var(--color-attention-emphasis)",
                    }}
                  />
                </div>
              </div>

              {/* Check status banner */}
              <div
                className="mt-4 flex items-center gap-2 p-3 rounded-md"
                style={{
                  backgroundColor: isPassing
                    ? "var(--color-success-subtle)"
                    : "var(--color-attention-subtle)",
                  border: `1px solid ${
                    isPassing
                      ? "rgba(46, 160, 67, 0.4)"
                      : "rgba(187, 128, 9, 0.4)"
                  }`,
                }}
              >
                {isPassing ? (
                  <Check
                    className="w-4 h-4"
                    style={{ color: "var(--color-success-fg)" }}
                    strokeWidth={2.5}
                  />
                ) : (
                  <Clock
                    className="w-4 h-4"
                    style={{ color: "var(--color-attention-fg)" }}
                  />
                )}
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isPassing
                      ? "var(--color-success-fg)"
                      : "var(--color-attention-fg)",
                  }}
                >
                  {isPassing
                    ? "All checks have passed"
                    : `Waiting for approvals (${requiredTotal - approvedWeight} more needed)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
