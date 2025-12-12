import { Github, ExternalLink } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <svg
                className="w-4 h-4 text-background"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="font-semibold text-foreground text-sm">
              weighted-approvals
            </span>
          </a>

          <nav className="flex items-center gap-1">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted hidden sm:block"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted hidden sm:block"
            >
              How it works
            </a>
            <a
              href="https://github.com/your-org/weighted-approvals"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-muted text-sm font-medium transition-all ml-2"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
