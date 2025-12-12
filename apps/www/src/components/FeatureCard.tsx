import type { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all duration-200 group">
      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground mb-4 group-hover:bg-muted/80 transition-colors">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
