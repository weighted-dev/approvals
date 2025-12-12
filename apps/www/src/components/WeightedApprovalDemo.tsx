import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, Clock } from "lucide-react";

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
        className="relative rounded-xl border border-border bg-card shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-muted-foreground text-sm font-mono">
            Pull Request #42
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Changed files */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2.5">
              Changed Files
            </div>
            <div className="space-y-1">
              {changedFiles.map((file, i) => (
                <motion.div
                  key={file}
                  className="flex items-center gap-2 text-sm font-mono"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-emerald-600">+</span>
                  <span className="text-foreground/80">{file}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Matched rule indicator */}
          <motion.div
            className="px-3.5 py-2.5 rounded-lg bg-muted/50 border border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 1 ? 1 : 0.4 }}
          >
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Matched Rule
            </div>
            <div className="font-mono text-sm">
              <span className="text-cyan-600">paths:</span>{" "}
              <span className="text-foreground/80">["infra/**"]</span>
              <span className="text-muted-foreground mx-2">→</span>
              <span className="text-emerald-600 font-medium">
                required_total: {requiredTotal}
              </span>
            </div>
          </motion.div>

          {/* Reviewers */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2.5">
              Reviewers
            </div>
            <div className="flex flex-wrap gap-2.5">
              {reviewers.map((reviewer, idx) => {
                const isApproved = approvals.includes(idx);
                return (
                  <motion.div
                    key={reviewer.name}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300
                      ${
                        isApproved
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-border bg-muted/30"
                      }
                    `}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                        ${
                          isApproved
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }
                      `}
                    >
                      {reviewer.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-mono text-foreground">
                        {reviewer.name}
                      </div>
                      <div
                        className={`text-xs font-mono ${
                          isApproved
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        +{reviewer.weight}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isApproved && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="w-3 h-3 text-white" />
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
              <span className="text-muted-foreground font-medium uppercase tracking-wider">
                Approval Progress
              </span>
              <span
                className={`font-mono font-medium ${
                  isPassing ? "text-emerald-600" : "text-foreground/70"
                }`}
              >
                {currentTotal} / {requiredTotal}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isPassing
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                    : "bg-emerald-400"
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
              flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-sm transition-all duration-300
              ${
                isPassing
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-muted/50 text-muted-foreground border border-border"
              }
            `}
          >
            {isPassing ? (
              <>
                <Check className="w-4 h-4" />
                <span className="font-medium">Check passed</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Waiting for approvals...</span>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
