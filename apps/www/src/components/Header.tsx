import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, BookOpen } from "lucide-react";
import { useState } from "react";

// GitHub's Octicon mark
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// Weighted logo with +2 badge (matches favicon)
function WeightedLogo({ className }: { className?: string }) {
  return (
    <div className={`relative ${className || ""}`}>
      <GitHubMark className="w-8 h-8" />
      <div
        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{
          backgroundColor: "var(--color-success-emphasis)",
          color: "#fff",
        }}
      >
        +2
      </div>
    </div>
  );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: "var(--color-canvas-default)",
        borderBottom: "1px solid var(--color-border-default)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <WeightedLogo className="transition-opacity group-hover:opacity-80" />
            <div className="flex items-center">
              <span
                className="font-semibold text-base"
                style={{ color: "var(--color-fg-default)" }}
              >
                Weighted Approvals
              </span>
              <span
                className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: "var(--color-accent-subtle)",
                  color: "var(--color-accent-fg)",
                }}
              >
                Action
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {isHome && (
              <>
                <a
                  href="#features"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ color: "var(--color-fg-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-fg-default)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--color-fg-muted)")
                  }
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ color: "var(--color-fg-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-fg-default)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--color-fg-muted)")
                  }
                >
                  How it works
                </a>
                <a
                  href="#config"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ color: "var(--color-fg-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-fg-default)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--color-fg-muted)")
                  }
                >
                  Config
                </a>
              </>
            )}

            <Link
              to="/docs"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                color:
                  location.pathname === "/docs"
                    ? "var(--color-fg-default)"
                    : "var(--color-fg-muted)",
              }}
            >
              <BookOpen className="w-4 h-4" />
              Docs
            </Link>

            <div
              className="w-px h-5 mx-2"
              style={{ backgroundColor: "var(--color-border-default)" }}
            />

            <a
              href="https://github.com/weighted-dev/approvals"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: "var(--color-canvas-subtle)",
                color: "var(--color-fg-default)",
                border: "1px solid var(--color-border-default)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-border-default)";
                e.currentTarget.style.borderColor = "var(--color-fg-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-canvas-subtle)";
                e.currentTarget.style.borderColor =
                  "var(--color-border-default)";
              }}
            >
              <GitHubMark className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md transition-colors"
            style={{ color: "var(--color-fg-muted)" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden py-3 border-t"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <nav className="flex flex-col gap-1">
              {isHome && (
                <>
                  <a
                    href="#features"
                    className="px-3 py-2 rounded-md text-sm font-medium"
                    style={{ color: "var(--color-fg-muted)" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="px-3 py-2 rounded-md text-sm font-medium"
                    style={{ color: "var(--color-fg-muted)" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How it works
                  </a>
                  <a
                    href="#config"
                    className="px-3 py-2 rounded-md text-sm font-medium"
                    style={{ color: "var(--color-fg-muted)" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Config
                  </a>
                </>
              )}
              <Link
                to="/docs"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium"
                style={{ color: "var(--color-fg-muted)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="w-4 h-4" />
                Docs
              </Link>
              <a
                href="https://github.com/weighted-dev/approvals"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium mt-2 rounded-md"
                style={{
                  backgroundColor: "var(--color-canvas-subtle)",
                  color: "var(--color-fg-default)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <GitHubMark className="w-4 h-4" />
                <span>View on GitHub</span>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
