import { motion } from "framer-motion";
import { Plus, FileText, Users, CheckCircle, ChevronRight } from "lucide-react";

const steps = [
  {
    title: "PR Created",
    description: "Files changed are detected",
    icon: Plus,
  },
  {
    title: "Rules Match",
    description: "Path patterns determine required_total",
    icon: FileText,
  },
  {
    title: "Weights Applied",
    description: "Each reviewer contributes their weight",
    icon: Users,
  },
  {
    title: "Check Result",
    description: "Pass when current ≥ required",
    icon: CheckCircle,
  },
];

export function ApprovalFlowDiagram() {
  return (
    <div className="w-full py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex items-center">
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground mb-3 hover:bg-muted/80 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-foreground mb-1">
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground max-w-[140px]">
                    {step.description}
                  </div>
                </div>
              </motion.div>

              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:flex items-center mx-6 text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + 0.1 }}
                >
                  <div className="w-12 h-px bg-border" />
                  <ChevronRight className="w-4 h-4 -ml-1 text-muted-foreground/50" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
