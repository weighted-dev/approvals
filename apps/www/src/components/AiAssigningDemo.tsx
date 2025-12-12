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
  Sparkles,
  Brain,
  Users,
  AlertTriangle,
} from "lucide-react";
import { ShikiCode } from "./ShikiCode";

interface Team {
  name: string;
  description: string;
  suggested: boolean;
}

interface CheckStep {
  name: string;
  status: "success" | "pending" | "running" | "queued";
  duration?: string;
}

type AnalysisPhase =
  | "idle"
  | "fetching_diff"
  | "analyzing"
  | "thinking"
  | "complete";

const changedFiles = [
  { name: "src/auth/login.ts", additions: 89, deletions: 12 },
  { name: "src/auth/session.ts", additions: 45, deletions: 8 },
  { name: "src/api/users.ts", additions: 23, deletions: 5 },
  { name: "prisma/migrations/auth_update.sql", additions: 34, deletions: 0 },
];

const availableTeams: Team[] = [
  {
    name: "my-org/security",
    description: "Auth, crypto, sensitive data",
    suggested: false,
  },
  {
    name: "my-org/backend",
    description: "API endpoints, database",
    suggested: false,
  },
  {
    name: "my-org/frontend",
    description: "React, UI/UX",
    suggested: false,
  },
  {
    name: "my-org/platform",
    description: "Infrastructure, DevOps",
    suggested: false,
  },
];

const aiConfigYaml = `ai:
  enabled: true
  provider: openai
  api_key_env: OPENAI_API_KEY
  model: gpt-4o
  
  criticality_range:
    min: 1    # Low criticality = 1 approver
    max: 5    # High criticality = 5 approvers
  
  teams:
    - my-org/security
    - my-org/backend
    - my-org/frontend
    - my-org/platform
  
  team_descriptions:
    my-org/security: "Auth, crypto, sensitive data"
    my-org/backend: "API endpoints, database queries"
    my-org/frontend: "React, UI/UX, accessibility"
    my-org/platform: "Infrastructure, DevOps"

# Weights still apply to approvers
weights:
  default: 1
  teams:
    my-org/security: 2`;

const workflowYaml = `name: Weighted Approvals (AI)
on:
  pull_request:
    types: [opened, synchronize, reopened]
  pull_request_review:
    types: [submitted, dismissed]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: weighted-dev/approvals@v1
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
        env:
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}`;

// Simulated AI reasoning that will be "typed" out
const aiReasoning = `This PR modifies authentication and session handling code, including database migrations. Changes to auth logic require security review. Database schema changes need backend team validation.`;

type TabId = "demo" | "config" | "workflow";

export function AiAssigningDemo() {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("demo");
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [displayedReasoning, setDisplayedReasoning] = useState("");
  const [criticality, setCriticality] = useState(0);
  const [requiredApprovers, setRequiredApprovers] = useState(0);
  const [teams, setTeams] = useState<Team[]>(availableTeams);
  const [cycleCount, setCycleCount] = useState(0);

  // Reset and start animation cycle
  useEffect(() => {
    const runCycle = async () => {
      // Reset state
      setPhase("idle");
      setDisplayedReasoning("");
      setCriticality(0);
      setRequiredApprovers(0);
      setTeams(availableTeams.map((t) => ({ ...t, suggested: false })));

      // Start analysis after a brief pause
      await sleep(800);
      setPhase("fetching_diff");

      await sleep(1200);
      setPhase("analyzing");

      await sleep(1000);
      setPhase("thinking");

      // Type out the reasoning
      for (let i = 0; i <= aiReasoning.length; i++) {
        setDisplayedReasoning(aiReasoning.slice(0, i));
        await sleep(20);
      }

      await sleep(400);

      // Animate criticality counting up
      for (let c = 1; c <= 8; c++) {
        setCriticality(c);
        await sleep(80);
      }

      await sleep(300);

      // Calculate required approvers (8/10 criticality with range 1-5 = 4 approvers)
      setRequiredApprovers(4);

      await sleep(400);

      // Suggest teams one by one
      setTeams((prev) =>
        prev.map((t) =>
          t.name === "my-org/security" ? { ...t, suggested: true } : t
        )
      );
      await sleep(300);
      setTeams((prev) =>
        prev.map((t) =>
          t.name === "my-org/backend" ? { ...t, suggested: true } : t
        )
      );

      await sleep(500);
      setPhase("complete");

      // Wait before restarting
      await sleep(4000);
      setCycleCount((c) => c + 1);
    };

    runCycle();
  }, [cycleCount]);

  const isComplete = phase === "complete";

  const checkSteps: CheckStep[] = [
    { name: "Set up job", status: "success", duration: "1s" },
    { name: "Checkout repository", status: "success", duration: "2s" },
    { name: "Fetch PR diff", status: phase === "fetching_diff" ? "running" : phase === "idle" ? "queued" : "success", duration: phase === "idle" || phase === "fetching_diff" ? undefined : "1s" },
    { name: "AI analysis (GPT-4o)", status: phase === "analyzing" || phase === "thinking" ? "running" : ["idle", "fetching_diff"].includes(phase) ? "queued" : "success", duration: ["idle", "fetching_diff", "analyzing", "thinking"].includes(phase) ? undefined : "3s" },
    { name: "Evaluate approvals", status: isComplete ? "success" : "queued", duration: isComplete ? "0s" : undefined },
    { name: "Post check status", status: isComplete ? "success" : "queued", duration: isComplete ? "1s" : undefined },
  ];

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
                  style={{ backgroundColor: "var(--color-done-emphasis)" }}
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
          <AIDemoContent
            expanded={expanded}
            setExpanded={setExpanded}
            isComplete={isComplete}
            phase={phase}
            displayedReasoning={displayedReasoning}
            criticality={criticality}
            requiredApprovers={requiredApprovers}
            teams={teams}
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
              <span
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--color-done-subtle)",
                  color: "var(--color-done-fg)",
                }}
              >
                <Sparkles className="w-3 h-3" />
                AI Mode
              </span>
            </div>
            <ShikiCode code={aiConfigYaml} lang="yaml" />
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// AI Demo content component
function AIDemoContent({
  expanded,
  setExpanded,
  isComplete,
  phase,
  displayedReasoning,
  criticality,
  requiredApprovers,
  teams,
  checkSteps,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  isComplete: boolean;
  phase: AnalysisPhase;
  displayedReasoning: string;
  criticality: number;
  requiredApprovers: number;
  teams: Team[];
  checkSteps: CheckStep[];
}) {
  const suggestedTeams = teams.filter((t) => t.suggested);

  return (
    <>
      {/* Workflow header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{
          backgroundColor: "var(--color-canvas-inset)",
          borderColor: "var(--color-border-default)",
        }}
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            isComplete ? "" : "pulse-pending"
          }`}
          style={{
            backgroundColor: isComplete
              ? "var(--color-done-emphasis)"
              : "var(--color-attention-emphasis)",
          }}
        >
          {isComplete ? (
            <Sparkles className="w-3 h-3 text-white" strokeWidth={2.5} />
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
              Weighted Approvals (AI)
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                backgroundColor: isComplete
                  ? "var(--color-done-subtle)"
                  : "var(--color-attention-subtle)",
                color: isComplete
                  ? "var(--color-done-fg)"
                  : "var(--color-attention-fg)",
              }}
            >
              <Sparkles className="w-3 h-3" />
              {isComplete ? "Analyzed" : "Analyzing"}
            </span>
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--color-fg-muted)" }}
          >
            pull_request · triggered just now
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
                    isComplete ? "" : "pulse-pending"
                  }`}
                  style={{
                    backgroundColor: isComplete
                      ? "var(--color-done-emphasis)"
                      : "var(--color-attention-emphasis)",
                  }}
                >
                  {isComplete ? (
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  ) : (
                    <Clock className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                  )}
                </div>
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--color-fg-default)" }}
                >
                  ai-evaluate
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
                      style={{ borderColor: "var(--color-done-fg)" }}
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

          {/* Right panel - AI Analysis */}
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
                style={{ color: "var(--color-open-fg)" }}
              />
              <div className="min-w-0 flex-1">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-fg-default)" }}
                >
                  feat: refactor authentication flow
                </span>
                <span
                  className="text-sm ml-2"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  #127
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

            {/* AI Analysis Section */}
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: "var(--color-border-muted)" }}
            >
              <div
                className="text-xs font-medium mb-3 uppercase tracking-wide flex items-center gap-2"
                style={{ color: "var(--color-fg-muted)" }}
              >
                <Brain className="w-3.5 h-3.5" />
                AI Analysis
                {(phase === "analyzing" || phase === "thinking") && (
                  <span
                    className="text-xs font-normal normal-case ml-1"
                    style={{ color: "var(--color-done-fg)" }}
                  >
                    (GPT-4o)
                  </span>
                )}
              </div>

              {/* AI Reasoning Box */}
              <div
                className="rounded-md p-3 mb-3 min-h-[60px]"
                style={{
                  backgroundColor: "var(--color-canvas-inset)",
                  border: "1px solid var(--color-border-muted)",
                }}
              >
                {phase === "idle" || phase === "fetching_diff" ? (
                  <span
                    className="text-sm italic"
                    style={{ color: "var(--color-fg-subtle)" }}
                  >
                    Waiting for diff...
                  </span>
                ) : phase === "analyzing" ? (
                  <span
                    className="text-sm italic flex items-center gap-2"
                    style={{ color: "var(--color-done-fg)" }}
                  >
                    <div
                      className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "var(--color-done-fg)" }}
                    />
                    Analyzing code changes...
                  </span>
                ) : (
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-fg-default)" }}
                  >
                    {displayedReasoning}
                    {phase === "thinking" && (
                      <span
                        className="inline-block w-2 h-4 ml-0.5 animate-pulse"
                        style={{ backgroundColor: "var(--color-done-emphasis)" }}
                      />
                    )}
                  </span>
                )}
              </div>

              {/* Criticality and Required */}
              <div className="grid grid-cols-2 gap-3">
                {/* Criticality Score */}
                <div
                  className="rounded-md p-3"
                  style={{
                    backgroundColor: "var(--color-canvas-inset)",
                    border: "1px solid var(--color-border-muted)",
                  }}
                >
                  <div
                    className="text-xs font-medium mb-2 flex items-center gap-1.5"
                    style={{ color: "var(--color-fg-muted)" }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Criticality
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-2xl font-bold tabular-nums"
                      style={{
                        color:
                          criticality >= 7
                            ? "var(--color-danger-fg)"
                            : criticality >= 5
                            ? "var(--color-attention-fg)"
                            : "var(--color-success-fg)",
                      }}
                    >
                      {criticality || "—"}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "var(--color-fg-subtle)" }}
                    >
                      / 10
                    </span>
                  </div>
                  {criticality >= 7 && (
                    <span
                      className="text-xs mt-1 block"
                      style={{ color: "var(--color-danger-fg)" }}
                    >
                      High risk
                    </span>
                  )}
                </div>

                {/* Required Approvers */}
                <div
                  className="rounded-md p-3"
                  style={{
                    backgroundColor: "var(--color-canvas-inset)",
                    border: "1px solid var(--color-border-muted)",
                  }}
                >
                  <div
                    className="text-xs font-medium mb-2 flex items-center gap-1.5"
                    style={{ color: "var(--color-fg-muted)" }}
                  >
                    <Users className="w-3 h-3" />
                    Required
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: "var(--color-fg-default)" }}
                    >
                      {requiredApprovers || "—"}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "var(--color-fg-subtle)" }}
                    >
                      approvers
                    </span>
                  </div>
                  {requiredApprovers > 0 && (
                    <span
                      className="text-xs mt-1 block"
                      style={{ color: "var(--color-fg-subtle)" }}
                    >
                      mapped from 1-5 range
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Suggested Teams */}
            <div className="px-4 py-3">
              <div
                className="text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-2"
                style={{ color: "var(--color-fg-muted)" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Suggested Reviewers
              </div>
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.name}
                    className="flex items-center gap-3 p-2 rounded-md transition-all duration-300"
                    style={{
                      backgroundColor: team.suggested
                        ? "var(--color-done-subtle)"
                        : "transparent",
                      opacity: team.suggested ? 1 : 0.5,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: team.suggested
                          ? "var(--color-done-emphasis)"
                          : "var(--color-canvas-overlay)",
                        color: team.suggested
                          ? "#fff"
                          : "var(--color-fg-muted)",
                        border: team.suggested
                          ? "none"
                          : "1px solid var(--color-border-default)",
                      }}
                    >
                      {team.suggested ? (
                        <Check className="w-3 h-3" strokeWidth={3} />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--color-fg-default)" }}
                      >
                        @{team.name}
                      </span>
                      <span
                        className="text-xs ml-2"
                        style={{ color: "var(--color-fg-subtle)" }}
                      >
                        {team.description}
                      </span>
                    </div>
                    {team.suggested && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: "var(--color-done-emphasis)",
                          color: "#fff",
                        }}
                      >
                        AI suggested
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Status banner */}
              <div
                className="mt-4 flex items-center gap-2 p-3 rounded-md transition-all duration-500"
                style={{
                  backgroundColor: isComplete
                    ? "var(--color-done-subtle)"
                    : "var(--color-attention-subtle)",
                  border: `1px solid ${
                    isComplete
                      ? "rgba(130, 80, 223, 0.4)"
                      : "rgba(187, 128, 9, 0.4)"
                  }`,
                }}
              >
                {isComplete ? (
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: "var(--color-done-fg)" }}
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
                    color: isComplete
                      ? "var(--color-done-fg)"
                      : "var(--color-attention-fg)",
                  }}
                >
                  {isComplete
                    ? `AI assigned ${suggestedTeams.length} teams · Requires ${requiredApprovers} approvals`
                    : "AI is analyzing the pull request..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

