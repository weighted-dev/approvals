import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="font-mono font-bold text-sm">weighted-approvals</span>
    ),
  },
  githubUrl: "https://github.com/your-org/weighted-approvals",
  links: [
    {
      text: "Documentation",
      url: "/docs",
      active: "nested-url",
    },
  ],
};



