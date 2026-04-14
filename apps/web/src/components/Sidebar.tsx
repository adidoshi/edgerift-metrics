import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, BookOpen, Clock, Home, TrendingUp, X } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Trading History", href: "/history", icon: Clock },
];

interface SidebarContentProps {
  onClose?: () => void;
}

function SidebarContent({ onClose }: SidebarContentProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-display text-sidebar-foreground tracking-tight">
            TradeFlow
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
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
                "w-4 h-4 flex-shrink-0 transition-smooth",
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

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 font-mono">
          v1.0 · TradeFlow
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
