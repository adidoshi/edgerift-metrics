import { Layout } from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Calendar,
  // Github,
  Mail,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

// ── Inline SVG: candlestick / trading chart illustration ──────────────────────
function TradingIllustration() {
  const candles = [
    { x: 70, high: 185, open: 215, close: 200, low: 230, green: false },
    { x: 110, high: 178, open: 208, close: 192, low: 220, green: false },
    { x: 150, high: 162, open: 195, close: 175, low: 210, green: true },
    { x: 190, high: 148, open: 178, close: 158, low: 192, green: true },
    { x: 230, high: 118, open: 148, close: 128, low: 162, green: true },
    { x: 270, high: 100, open: 128, close: 108, low: 145, green: true },
    { x: 310, high: 82, open: 108, close: 90, low: 122, green: true },
    { x: 350, high: 68, open: 95, close: 75, low: 110, green: true },
  ];
  const volumes = [18, 14, 22, 16, 28, 20, 24, 30];
  const gridYs = [60, 110, 160, 210, 260];

  return (
    <svg
      viewBox="0 0 420 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md mx-auto lg:max-w-full"
      aria-hidden="true"
    >
      {/* Background glow */}
      <ellipse
        cx="210"
        cy="160"
        rx="180"
        ry="130"
        fill="oklch(0.72 0.21 262 / 0.07)"
      />

      {/* Grid lines */}
      {gridYs.map((y) => (
        <line
          key={y}
          x1="40"
          y1={y}
          x2="390"
          y2={y}
          stroke="oklch(0.72 0.21 262 / 0.12)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {/* Area fill under trend */}
      <path
        d="M50,230 90,200 130,215 170,175 210,155 250,130 290,105 340,85 385,65 L385,280 L50,280 Z"
        fill="oklch(0.72 0.21 262 / 0.08)"
      />

      {/* Trend line */}
      <polyline
        points="50,230 90,200 130,215 170,175 210,155 250,130 290,105 340,85 385,65"
        fill="none"
        stroke="oklch(0.80 0.25 262 / 0.5)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Candlesticks */}
      {candles.map((c) => (
        <g key={c.x}>
          <line
            x1={c.x}
            y1={c.high}
            x2={c.x}
            y2={c.low}
            stroke={c.green ? "oklch(0.78 0.26 167)" : "oklch(0.65 0.29 22)"}
            strokeWidth="1.5"
          />
          <rect
            x={c.x - 8}
            y={c.green ? c.close : c.open}
            width={16}
            height={Math.abs(c.open - c.close)}
            rx="2"
            fill={
              c.green
                ? "oklch(0.78 0.26 167 / 0.85)"
                : "oklch(0.65 0.29 22 / 0.85)"
            }
          />
        </g>
      ))}

      {/* Volume bars */}
      {[70, 110, 150, 190, 230, 270, 310, 350].map((x, i) => (
        <rect
          key={x}
          x={x - 8}
          y={280 - volumes[i]}
          width={16}
          height={volumes[i]}
          rx="2"
          fill="oklch(0.72 0.21 262 / 0.25)"
        />
      ))}

      {/* Accent dot on latest candle */}
      <circle
        cx="350"
        cy="75"
        r="6"
        fill="oklch(0.80 0.25 262)"
        opacity="0.9"
      />
      <circle cx="350" cy="75" r="12" fill="oklch(0.80 0.25 262 / 0.25)" />

      {/* Label callout */}
      <rect
        x="290"
        y="40"
        width="110"
        height="26"
        rx="6"
        fill="oklch(0.14 0 0 / 0.9)"
        stroke="oklch(0.72 0.21 262 / 0.4)"
        strokeWidth="1"
      />
      <text
        x="345"
        y="57"
        textAnchor="middle"
        fill="oklch(0.80 0.25 262)"
        fontSize="11"
        fontFamily="monospace"
      >
        +24.7% ↑
      </text>

      {/* Axis labels */}
      {(["Jan", "Mar", "May", "Jul"] as const).map((label, i) => (
        <text
          key={label}
          x={50 + i * 100}
          y="298"
          fill="oklch(0.62 0 0)"
          fontSize="9"
          fontFamily="monospace"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

// ── Feature cards data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: BookOpen,
    title: "Trade Journaling",
    description:
      "Log every trade with instrument, pair, direction, PnL, session, strategy, and chart screenshots. Build a complete trading record.",
    accent: "262",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Visualise your equity curve, win rate, R-multiple distribution, and drawdown patterns with interactive charts.",
    accent: "186",
  },
  {
    icon: TrendingUp,
    title: "Performance Tracking",
    description:
      "Monitor consistency scores, average R, and profit factor across different sessions, instruments, and strategies.",
    accent: "167",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description:
      "Review daily P&L on a trading calendar — instantly spot your best and worst days, weeks, and months at a glance.",
    accent: "92",
  },
] as const;

const FUTURE_FEATURES = [
  "AI-powered trade pattern recognition",
  "Real-time broker account sync",
  "Community leaderboard & shared setups",
];

// ── Home page ─────────────────────────────────────────────────────────────────
export const Home = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background border-b border-border">
        {/* Radial gradient backdrop */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 60% 40%, oklch(0.72 0.21 262 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 90% 80%, oklch(0.78 0.26 167 / 0.06) 0%, transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: copy */}
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <Badge
                variant="outline"
                className="mb-4 border-primary/40 text-primary bg-primary/10 font-mono text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Professional Trading Analytics
              </Badge>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
                TradeFlow
              </h1>
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground/80 leading-tight mb-6">
                Master Your Trades.{" "}
                <span className="text-primary">Track Your Edge.</span>
              </p>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                A professional-grade journaling and analytics platform built for
                serious traders. Log trades, dissect patterns, and compound your
                edge — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="font-display font-semibold text-base transition-smooth"
                  onClick={() => navigate({ to: "/journal" })}
                  data-ocid="hero-cta-journal"
                >
                  Start Journaling
                  <BookOpen className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-display font-semibold text-base border-border hover:border-primary/60 hover:bg-primary/10 transition-smooth"
                  onClick={() => navigate({ to: "/analytics" })}
                  data-ocid="hero-cta-analytics"
                >
                  View Analytics
                  <BarChart3 className="ml-2 w-4 h-4" />
                </Button>
              </div>

              {/* Stat row */}
              <div className="mt-10 flex flex-wrap gap-6 justify-center lg:justify-start">
                {[
                  { value: "4 Modules", label: "Built for traders" },
                  { value: "Real-time", label: "Analytics & charts" },
                  { value: "100%", label: "Free to use" },
                ].map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <p className="font-display font-bold text-lg text-foreground">
                      {s.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: illustration */}
            <motion.div
              className="flex-1 w-full"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <div className="relative p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-xl">
                <div className="absolute top-3 left-4 flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                </div>
                <div className="pt-4">
                  <TradingIllustration />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Key Features ────────────────────────────────────────────────── */}
      <section className="bg-muted/30 py-16 lg:py-24 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-3 border-primary/40 text-primary bg-primary/10 font-mono text-xs"
            >
              Platform Features
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-2">
              Everything You Need to Grow
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              From logging your first trade to analysing years of data —
              TradeFlow has every tool a disciplined trader needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card
                  className="h-full bg-card border-border card-hover group cursor-default"
                  data-ocid={`feature-card-${i}`}
                >
                  <CardContent className="p-6 flex flex-col gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-smooth group-hover:scale-110"
                      style={{
                        background: `oklch(0.72 0.21 ${feat.accent} / 0.15)`,
                        border: `1px solid oklch(0.72 0.21 ${feat.accent} / 0.3)`,
                      }}
                    >
                      <feat.icon
                        className="w-5 h-5"
                        style={{ color: `oklch(0.80 0.25 ${feat.accent})` }}
                      />
                    </div>

                    {/* Text */}
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-smooth">
                        {feat.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feat.description}
                      </p>
                    </div>

                    {/* Bottom accent bar */}
                    <div
                      className="mt-auto h-0.5 w-0 group-hover:w-full rounded-full transition-all duration-500"
                      style={{
                        background: `oklch(0.72 0.21 ${feat.accent} / 0.6)`,
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="bg-background py-14 border-b border-border">
        <motion.div
          className="mx-auto max-w-3xl px-4 sm:px-6 text-center"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="rounded-2xl border border-primary/30 p-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 50%, oklch(0.72 0.21 262 / 0.1) 0%, transparent 70%)",
            }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Ready to Build Your Edge?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start logging trades today and unlock data-driven insights that
              separate winning traders from the rest.
            </p>
            <Button
              size="lg"
              className="font-display font-semibold transition-smooth"
              onClick={() => navigate({ to: "/journal" })}
              data-ocid="cta-banner-journal"
            >
              Open Trade Journal
              <TrendingUp className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="bg-card border-t border-border py-12"
        data-ocid="footer"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            {/* Contact */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-widest">
                Contact
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:hello@tradeflow.app"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth text-sm"
                    data-ocid="footer-email"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    hello@tradeflow.app
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/tradeflow-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth text-sm"
                    data-ocid="footer-github"
                  >
                    {/* <Github className="w-4 h-4 shrink-0" /> */}
                    github.com/tradeflow-app
                  </a>
                </li>
              </ul>
            </div>

            {/* Made By */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-widest">
                Made By
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Crafted with care by traders, for traders. Built to solve the
                journaling problems we faced ourselves.
              </p>
              <div className="flex flex-wrap gap-2">
                {["React", "TypeScript", "Tailwind CSS", "Recharts"].map(
                  (t) => (
                    <span
                      key={t}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-muted/60 text-muted-foreground"
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Future Vision */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-widest">
                Future Vision
              </h4>
              <ul className="space-y-2.5">
                {FUTURE_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-display font-bold text-foreground text-sm tracking-tight">
              TradeFlow
            </span>
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.hostname : "",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
};
