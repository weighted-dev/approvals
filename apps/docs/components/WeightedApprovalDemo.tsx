"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface Reviewer {
  name: string;
  weight: number;
  avatar: string;
}

const reviewers: Reviewer[] = [
  { name: "alice", weight: 2, avatar: "A" },
  { name: "bob", weight: 1, avatar: "B" },
  { name: "carol", weight: 1, avatar: "C" },
];

const changedFiles = [
  "src/components/Button.tsx",
  "src/utils/api.ts",
  "infra/terraform/main.tf",
];

export function WeightedApprovalDemo() {
  const [step, setStep] = useState(0);
  const [approvals, setApprovals] = useState<number[]>([]);
  const requiredTotal = 3;

  const currentTotal = approvals.reduce(
    (sum, idx) => sum + reviewers[idx].weight,
    0
  );
  const isPassing = currentTotal >= requiredTotal;

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next === 3) setApprovals([0]); // Alice approves
        if (next === 5) setApprovals([0, 1]); // Bob approves
        if (next === 8) {
          // Reset
          setApprovals([]);
          return 0;
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Main container */}
      <motion.div
        className="relative rounded-2xl border border-emerald-500/20 bg-zinc-950/80 backdrop-blur-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-zinc-400 text-sm font-mono">
            Pull Request #42
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Changed files */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
              Changed Files
            </div>
            <div className="space-y-1.5">
              {changedFiles.map((file, i) => (
                <motion.div
                  key={file}
                  className="flex items-center gap-2 text-sm font-mono"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-emerald-400">+</span>
                  <span className="text-zinc-300">{file}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Matched rule indicator */}
          <motion.div
            className="px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 1 ? 1 : 0.3 }}
          >
            <div className="text-xs text-zinc-500 mb-1">Matched Rule</div>
            <div className="font-mono text-sm">
              <span className="text-cyan-400">paths:</span>{" "}
              <span className="text-zinc-300">[&quot;infra/**&quot;]</span>
              <span className="text-zinc-600 mx-2">→</span>
              <span className="text-emerald-400">
                required_total: {requiredTotal}
              </span>
            </div>
          </motion.div>

          {/* Reviewers */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
              Reviewers
            </div>
            <div className="flex gap-3">
              {reviewers.map((reviewer, idx) => {
                const isApproved = approvals.includes(idx);
                return (
                  <motion.div
                    key={reviewer.name}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-300
                      ${
                        isApproved
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : "border-zinc-800 bg-zinc-900/50"
                      }
                    `}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300
                        ${
                          isApproved
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-800 text-zinc-400"
                        }
                      `}
                    >
                      {reviewer.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-mono text-zinc-300">
                        {reviewer.name}
                      </div>
                      <div
                        className={`text-xs font-mono ${
                          isApproved ? "text-emerald-400" : "text-zinc-500"
                        }`}
                      >
                        +{reviewer.weight}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isApproved && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-zinc-500 uppercase tracking-wider">
                Approval Progress
              </span>
              <span
                className={`font-mono ${
                  isPassing ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                {currentTotal} / {requiredTotal}
              </span>
            </div>
            <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isPassing
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500"
                }`}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    (currentTotal / requiredTotal) * 100,
                    100
                  )}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Status */}
          <motion.div
            className={`
              flex items-center justify-center gap-2 py-3 rounded-lg font-mono text-sm transition-colors duration-300
              ${
                isPassing
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-900/50 text-zinc-400 border border-zinc-800"
              }
            `}
            animate={{
              boxShadow: isPassing
                ? "0 0 30px rgba(16, 185, 129, 0.2)"
                : "none",
            }}
          >
            {isPassing ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Check passed</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Waiting for approvals...</span>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 blur-xl -z-10 opacity-50" />
    </div>
  );
}


