import Link from "next/link";
import { WeightedApprovalDemo } from "@/components/WeightedApprovalDemo";
import { ApprovalFlowDiagram } from "@/components/ApprovalFlowDiagram";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 bg-grid-pattern">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 pt-24 pb-16 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-zinc-400 font-mono">
                GitHub Action
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-white">Weighted</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Approvals
              </span>
            </h1>

            <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Gerrit/Jenkins-style weighted approvals for GitHub Pull Requests.
              Configure reviewer weights and path-based rules, enforced via a
              required Check Run.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/docs"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:from-emerald-400 hover:to-cyan-400 transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                Get Started
              </Link>
              <a
                href="https://github.com/your-org/weighted-approvals"
                className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-900 hover:border-zinc-600 transition-all duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>

          {/* Interactive Demo */}
          <WeightedApprovalDemo />
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-white mb-4">
            How It Works
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-lg mx-auto">
            A simple flow that gives you fine-grained control over PR approvals
          </p>
          <ApprovalFlowDiagram />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              title="Weighted Reviewers"
              description="Assign different weights to reviewers. A senior dev with +2 can approve alone, or two +1 reviewers can combine."
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
            />
            <FeatureCard
              title="Path-Based Rules"
              description="Different directories can require different approval thresholds. Critical infrastructure can need +3, while docs need +1."
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              }
            />
            <FeatureCard
              title="Team Logic"
              description="Use AND/OR logic for team requirements. Require approvals from frontend AND backend teams, or any platform member."
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Example Config Section */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-white mb-4">
            Simple Configuration
          </h2>
          <p className="text-zinc-400 text-center mb-10 max-w-lg mx-auto">
            Add a YAML file to your repo and you&apos;re ready to go
          </p>

          <div className="max-w-2xl mx-auto rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <span className="text-zinc-400 text-sm font-mono">
                .github/weighted-approvals.yml
              </span>
            </div>
            <pre className="p-5 text-sm font-mono overflow-x-auto">
              <code className="text-zinc-300">
                {`weights:
  users:
    alice: 2    # Senior dev
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
        my-org/sre: 1`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-zinc-400 mb-8">
            Add weighted approvals to your repository in minutes.
          </p>
          <Link
            href="/docs"
            className="inline-flex px-8 py-4 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:from-emerald-400 hover:to-cyan-400 transition-all duration-200 shadow-lg shadow-emerald-500/25"
          >
            Read the Documentation
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-zinc-800/50">
        <div className="container mx-auto px-6 text-center text-zinc-500 text-sm">
          <p>MIT License · Built with Fumadocs</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-200">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
