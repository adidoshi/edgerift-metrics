import { Button } from "../components/ui/button";
import { useTheme } from "../hooks/use-theme";
import { authStore, useAuthStore } from "../lib/auth";
import { cn } from "../lib/utils";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Clock,
  Home,
  Lightbulb,
  Moon,
  Sun,
  TrendingUp,
  LogIn,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "AI Insights", href: "/ai-insights", icon: Lightbulb },
  { label: "Trading History", href: "/trading-history", icon: Clock },
];

interface SidebarContentProps {
  onClose?: () => void;
}

function SidebarContent({ onClose }: SidebarContentProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { theme, toggleTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isAuthenticated = Boolean(user);
  const displayName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-display text-sidebar-foreground tracking-tight">
            Edgerift Metrics
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            onClick={onClose}
            data-ocid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth group",
              isActive(href)
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent",
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0 transition-smooth",
                isActive(href)
                  ? "text-primary"
                  : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
              )}
            />
            {label}
            {isActive(href) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </nav>

      {/* Auth section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 font-medium transition-smooth text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer"
          onClick={() => {
            toggleTheme();
            onClose?.();
          }}
          data-ocid="nav-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
        </Button>

        {isAuthenticated ? (
          <>
            {/* Principal display */}
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{
                background: "oklch(0.72 0.21 262 / 0.08)",
                border: "1px solid oklch(0.72 0.21 262 / 0.18)",
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0"
                style={{
                  background: "oklch(0.72 0.21 262 / 0.2)",
                  color: "oklch(0.80 0.25 262)",
                }}
              >
                ◈
              </div>
              <div className="min-w-0">
                <p
                  className="font-mono text-xs truncate"
                  style={{ color: "oklch(0.72 0.21 262)" }}
                >
                  {displayName}
                </p>
                <p className="text-xs" style={{ color: "oklch(0.50 0 0)" }}>
                  {user?.email}
                </p>
              </div>
              <span
                className="ml-auto w-2 h-2 rounded-full shrink-0"
                style={{ background: "oklch(0.75 0.2 167)" }}
              />
            </div>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2.5 font-medium transition-smooth text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              onClick={() => {
                authStore.clearAuth();
                toast.success("You have been logged out.", {
                  id: "logout-success",
                });
                onClose?.();
                navigate({ to: "/signin" });
              }}
              data-ocid="nav-logout-button"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 font-medium transition-smooth text-primary hover:bg-primary/10 hover:text-primary cursor-pointer"
            onClick={() => navigate({ to: "/signin" })}
            data-ocid="nav-signin-button"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 font-mono">
          v1.0 · Edgerift Metrics
        </p>
      </div>
    </div>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-60 fixed top-0 left-0 bottom-0 z-30",
        className,
      )}
    >
      <SidebarContent />
    </aside>
  );
}

export { SidebarContent };
