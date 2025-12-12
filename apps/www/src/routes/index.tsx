import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, FolderTree, GitMerge, Github, ArrowRight } from "lucide-react";
import { WeightedApprovalDemo } from "../components/WeightedApprovalDemo";
import { ApprovalFlowDiagram } from "../components/ApprovalFlowDiagram";
import { FeatureCard } from "../components/FeatureCard";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-20 bg-dot-pattern">
        <div className="container mx-auto px-6 relative">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">
                GitHub Action
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl font-bold tracking-tight mb-5 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Weighted Approvals
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Gerrit/Jenkins-style weighted approvals for GitHub Pull Requests.
              Configure reviewer weights and path-based rules, enforced via a
              required Check Run.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <a
                href="https://github.com/your-org/weighted-approvals#installation"
                className="group px-5 py-2.5 rounded-lg bg-foreground text-background font-medium hover:bg-foreground/90 transition-all duration-200 flex items-center gap-2 text-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="https://github.com/your-org/weighted-approvals"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-all duration-200 flex items-center gap-2 text-sm"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
            </motion.div>
          </div>

          {/* Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <WeightedApprovalDemo />
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              A simple flow that gives you fine-grained control over PR
              approvals
            </p>
          </motion.div>
          <ApprovalFlowDiagram />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Features
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Everything you need for sophisticated code review workflows
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <FeatureCard
                title="Weighted Reviewers"
                description="Assign different weights to reviewers. A senior dev with +2 can approve alone, or two +1 reviewers can combine."
                icon={<Users className="w-5 h-5" />}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <FeatureCard
                title="Path-Based Rules"
                description="Different directories can require different approval thresholds. Critical infrastructure can need +3, while docs need +1."
                icon={<FolderTree className="w-5 h-5" />}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <FeatureCard
                title="Team Logic"
                description="Use AND/OR logic for team requirements. Require approvals from frontend AND backend teams, or any platform member."
                icon={<GitMerge className="w-5 h-5" />}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Example Config Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Simple Configuration
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add a YAML file to your repo and you're ready to go
            </p>
          </motion.div>

          <motion.div
            className="max-w-xl mx-auto rounded-xl border border-border bg-card overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
              <span className="text-muted-foreground text-xs font-mono">
                .github/weighted-approvals.yml
              </span>
            </div>
            <pre className="p-4 text-sm font-mono overflow-x-auto">
              <code className="text-foreground/80">
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
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-6">
              Add weighted approvals to your repository in minutes.
            </p>
            <a
              href="https://github.com/your-org/weighted-approvals#installation"
              className="group inline-flex px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:bg-foreground/90 transition-all duration-200 items-center gap-2 text-sm"
            >
              Read the Documentation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>MIT License · Built with React + Vite</p>
        </div>
      </footer>
    </main>
  );
}
