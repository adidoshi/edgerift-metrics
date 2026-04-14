import { Layout } from "../components/Layout";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import type { Trade } from "../types/trading";
import { Direction, Instrument } from "../types/trading";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  subDays,
} from "date-fns";
import {
  BarChart2,
  Calendar,
  DollarSign,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── Mock data generator ────────────────────────────────────────────────────────

function generateMockTrades(): Trade[] {
  const sessions = [
    "London",
    "New York",
    "Tokyo",
    "Sydney",
    "London/NY Overlap",
  ];
  const pairs = [
    "EUR/USD",
    "GBP/USD",
    "XAUUSD",
    "NAS100",
    "USD/JPY",
    "US30",
    "XAGUSD",
  ];
  const instruments: Instrument[] = [
    Instrument.Forex,
    Instrument.Forex,
    Instrument.Commodity,
    Instrument.Index,
    Instrument.Forex,
    Instrument.Index,
    Instrument.Commodity,
  ];
  const now = Date.now();

  return Array.from({ length: 34 }, (_, i) => {
    const daysAgo = Math.floor(i * 0.9);
    const ts = BigInt(subDays(new Date(now), daysAgo).getTime()) * 1_000_000n;
    const pairIdx = i % pairs.length;
    const netPnL = Number.parseFloat(((Math.random() - 0.42) * 420).toFixed(2));
    return {
      id: `mock-${i}`,
      startDateTime: ts,
      endDateTime: ts + 3_600_000_000_000n,
      instrument: instruments[pairIdx],
      pair: pairs[pairIdx],
      direction: Math.random() > 0.5 ? Direction.Buy : Direction.Sell,
      rMultiple: Number.parseFloat((netPnL / 100).toFixed(2)),
      grossPnL: Number.parseFloat((netPnL * 1.08).toFixed(2)),
      netPnL,
      tags: [],
      session: sessions[i % sessions.length],
      strategy: "ICT",
      model: "Breaker",
      tradeIdea: "",
      comments: "",
      rulesFollowed: [],
      createdAt: ts,
    };
  });
}

// ── Derived analytics ──────────────────────────────────────────────────────────

function buildBalanceCurve(trades: Trade[], startBal: number) {
  const sorted = [...trades].sort((a, b) =>
    Number(a.startDateTime - b.startDateTime),
  );
  let balance = startBal;
  return sorted.map((t) => {
    balance += t.netPnL;
    return {
      date: format(new Date(Number(t.startDateTime) / 1_000_000), "MMM d"),
      balance: Number.parseFloat(balance.toFixed(2)),
    };
  });
}

function buildSessionPerf(trades: Trade[]) {
  const map: Record<string, { pnl: number; trades: number }> = {};
  for (const t of trades) {
    if (!map[t.session]) map[t.session] = { pnl: 0, trades: 0 };
    map[t.session].pnl += t.netPnL;
    map[t.session].trades += 1;
  }
  return Object.entries(map).map(([session, v]) => ({
    session: session.length > 12 ? `${session.slice(0, 10)}…` : session,
    pnl: Number.parseFloat(v.pnl.toFixed(2)),
    trades: v.trades,
  }));
}

function buildInstrumentDist(trades: Trade[]) {
  const map: Record<string, number> = {};
  for (const t of trades) {
    map[t.instrument] = (map[t.instrument] ?? 0) + 1;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function buildWinLoss(trades: Trade[]) {
  const wins = trades.filter((t) => t.netPnL > 0).length;
  const losses = trades.filter((t) => t.netPnL <= 0).length;
  const wr = trades.length ? Math.round((wins / trades.length) * 100) : 0;
  return {
    chartData: [
      { name: "Wins", value: wins, fill: "oklch(0.72 0.22 167)" },
      { name: "Losses", value: losses, fill: "oklch(0.65 0.29 22)" },
    ],
    winRate: wr,
    wins,
    losses,
  };
}

// ── Trading Calendar ───────────────────────────────────────────────────────────

interface DayData {
  date: Date;
  pnl: number;
  count: number;
  hasData: boolean;
}

function buildCalendar(trades: Trade[]): DayData[] {
  const today = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });
  return days.map((day) => {
    const dayTrades = trades.filter((t) =>
      isSameDay(new Date(Number(t.startDateTime) / 1_000_000), day),
    );
    const pnl = dayTrades.reduce((sum, t) => sum + t.netPnL, 0);
    return {
      date: day,
      pnl: Number.parseFloat(pnl.toFixed(2)),
      count: dayTrades.length,
      hasData: dayTrades.length > 0,
    };
  });
}

// ── Shared tooltip style ───────────────────────────────────────────────────────

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "oklch(0.14 0 0)",
  border: "1px solid oklch(0.22 0 0)",
  borderRadius: "8px",
  color: "oklch(0.96 0 0)",
  fontSize: "12px",
};
function formatTooltipCurrency(
  value: number | string | undefined,
  label: string,
) {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  return [
    `$${numericValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    label,
  ] as [string, string];
}

// ── Chart colors ──────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "oklch(0.82 0.28 262)",
  "oklch(0.68 0.25 92)",
  "oklch(0.7 0.24 186)",
  "oklch(0.78 0.26 167)",
  "oklch(0.78 0.22 36)",
];

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  accentClass?: string;
}

function StatCard({
  label,
  value,
  sub,
  trend,
  icon,
  accentClass,
}: StatCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-red-400"
        : "text-muted-foreground";

  return (
    <Card
      className="card-hover bg-card border-border relative overflow-hidden"
      data-ocid="stat-card"
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 ${accentClass ?? "bg-primary"}`}
      />
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-muted/60">{icon}</div>
          <TrendIcon className={`w-4 h-4 ${trendColor} mt-1`} />
        </div>
        <p className="metric-label mb-1">{label}</p>
        <p className="metric-large">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}

// ── Main Analytics Page ────────────────────────────────────────────────────────

export const Analytics = () => {
  // Data hooks are temporarily disabled so the UI can render before the data
  // layer is wired up.
  const summaryLoading = false;
  const rawTrades: Trade[] = [];
  const tradesLoading = false;

  const trades: Trade[] =
    rawTrades && rawTrades.length > 0 ? rawTrades : generateMockTrades();
  const isLoading = summaryLoading || tradesLoading;
  const usingMock = !rawTrades || rawTrades.length === 0;

  const startBal = 10000;
  const totalPnL = trades.reduce((s, t) => s + t.netPnL, 0);
  const currentBalance = startBal + totalPnL;
  const tradingDays = BigInt(
    new Set(
      trades.map((t) =>
        format(new Date(Number(t.startDateTime) / 1_000_000), "yyyy-MM-dd"),
      ),
    ).size,
  );

  const balanceCurve = buildBalanceCurve(trades, startBal);
  const sessionPerf = buildSessionPerf(trades);
  const instrDist = buildInstrumentDist(trades);
  const {
    chartData: winLossData,
    winRate: computedWR,
    wins,
    losses,
  } = buildWinLoss(trades);
  const calendarDays = buildCalendar(trades);
  const effectiveWR = Math.round(computedWR);

  const pnlTrend: "up" | "down" | "neutral" =
    totalPnL > 0 ? "up" : totalPnL < 0 ? "down" : "neutral";
  const balanceTrend: "up" | "down" | "neutral" =
    currentBalance > startBal
      ? "up"
      : currentBalance < startBal
        ? "down"
        : "neutral";

  const firstDay = startOfMonth(new Date());
  const startOffset = firstDay.getDay();

  const avgR = trades.length
    ? Number.parseFloat(
        (trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length).toFixed(
          2,
        ),
      )
    : 0;
  const bestR = trades.length ? Math.max(...trades.map((t) => t.rMultiple)) : 0;
  const worstR = trades.length
    ? Math.min(...trades.map((t) => t.rMultiple))
    : 0;
  const profitableTrades = trades.filter((t) => t.rMultiple > 0).length;

  const radialData = [
    {
      name: "R-Multiple",
      value: Math.max(0, Math.min(avgR * 50, 100)),
      fill: CHART_COLORS[0],
    },
  ];

  return (
    <Layout>
      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-350 mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Performance insights & trading metrics
            </p>
          </div>
          {usingMock && (
            <Badge
              variant="outline"
              className="text-xs border-primary/40 text-primary"
              data-ocid="mock-badge"
            >
              Sample Data
            </Badge>
          )}
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          data-ocid="stat-grid"
        >
          {isLoading ? (
            ["a", "b", "c", "d"].map((k) => (
              <Skeleton key={k} className="h-28 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                label="Account Balance"
                value={`$${currentBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                sub={`Started at $${startBal.toLocaleString()}`}
                trend={balanceTrend}
                icon={<DollarSign className="w-4 h-4 text-primary" />}
                accentClass="bg-primary"
              />
              <StatCard
                label="Total P&L"
                value={`${totalPnL >= 0 ? "+" : ""}$${totalPnL.toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}`}
                sub={`${trades.length} total trades`}
                trend={pnlTrend}
                icon={<TrendingUp className="w-4 h-4 text-secondary" />}
                accentClass="bg-secondary"
              />
              <StatCard
                label="Win Rate"
                value={`${effectiveWR}%`}
                sub={`${wins}W / ${losses}L`}
                trend={effectiveWR >= 50 ? "up" : "down"}
                icon={<Target className="w-4 h-4 text-chart-4" />}
                accentClass="bg-chart-4"
              />
              <StatCard
                label="Trading Days"
                value={tradingDays.toString()}
                sub="Active trading sessions"
                trend="neutral"
                icon={<Calendar className="w-4 h-4 text-chart-2" />}
                accentClass="bg-chart-2"
              />
            </>
          )}
        </div>

        {/* ── Balance Journey + Win/Loss ──────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card
            className="xl:col-span-2 bg-card border-border"
            data-ocid="balance-chart"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Balance Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton height={280} />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={balanceCurve}
                    margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                  >
                    <defs>
                      <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="oklch(0.82 0.28 262)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="oklch(0.82 0.28 262)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.22 0 0)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "oklch(0.62 0 0)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.62 0 0)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                      width={72}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) =>
                        formatTooltipCurrency(
                          typeof value === "number" || typeof value === "string"
                            ? value
                            : undefined,
                          "Balance",
                        )
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="oklch(0.82 0.28 262)"
                      strokeWidth={2}
                      fill="url(#balGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "oklch(0.82 0.28 262)" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Win/Loss donut */}
          <Card className="bg-card border-border" data-ocid="winloss-chart">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">
                Win / Loss Ratio
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isLoading ? (
                <ChartSkeleton height={240} />
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <Pie
                          data={winLossData}
                          cx="50%"
                          cy="50%"
                          innerRadius={64}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {winLossData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.fill}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-display font-bold">
                        {effectiveWR}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Win Rate
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2">
                    {winLossData.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ background: d.fill }}
                        />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Session Performance + Instrument Distribution ───────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="bg-card border-border" data-ocid="session-chart">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">
                Session P&amp;L
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton height={240} />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={sessionPerf}
                    margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.22 0 0)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="session"
                      tick={{ fill: "oklch(0.62 0 0)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.62 0 0)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `$${v}`}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) =>
                        formatTooltipCurrency(
                          typeof value === "number" || typeof value === "string"
                            ? value
                            : undefined,
                          "Net P&L",
                        )
                      }
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={56}>
                      {sessionPerf.map((entry) => (
                        <Cell
                          key={entry.session}
                          fill={
                            entry.pnl >= 0
                              ? "oklch(0.72 0.22 167)"
                              : "oklch(0.65 0.29 22)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Instrument Distribution */}
          <Card className="bg-card border-border" data-ocid="instrument-chart">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">
                Instrument Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isLoading ? (
                <ChartSkeleton height={240} />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={instrDist}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        labelLine={false}
                      >
                        {instrDist.map((entry, idx) => (
                          <Cell
                            key={entry.name}
                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {instrDist.map((d, idx) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{
                            background: CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── R-Multiple Radial + Trading Calendar ───────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="bg-card border-border" data-ocid="rmultiple-chart">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">
                Avg R-Multiple
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isLoading ? (
                <ChartSkeleton height={200} />
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width={180} height={180}>
                      <RadialBarChart
                        innerRadius={52}
                        outerRadius={80}
                        data={radialData}
                        startAngle={180}
                        endAngle={0}
                      >
                        <RadialBar
                          dataKey="value"
                          cornerRadius={8}
                          background={{ fill: "oklch(0.22 0 0)" }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pb-4 pointer-events-none">
                      <span className="text-2xl font-display font-bold">
                        {avgR}R
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Average
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    {[
                      { label: "Best R", value: `${bestR.toFixed(1)}R` },
                      { label: "Worst R", value: `${worstR.toFixed(1)}R` },
                      {
                        label: "Total Trades",
                        value: trades.length.toString(),
                      },
                      {
                        label: "Profitable",
                        value: profitableTrades.toString(),
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-muted/40 rounded-lg p-2 text-center"
                      >
                        <p className="metric-label text-xs">{s.label}</p>
                        <p className="text-sm font-semibold font-mono mt-0.5">
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Trading Calendar */}
          <Card
            className="xl:col-span-2 bg-card border-border"
            data-ocid="trading-calendar"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Calendar className="w-4 h-4 text-secondary" />
                Trading Calendar — {format(new Date(), "MMMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton height={220} />
              ) : (
                <div className="w-full">
                  {/* Week day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <div
                          key={d}
                          className="text-center text-xs text-muted-foreground py-1 font-medium"
                        >
                          {d}
                        </div>
                      ),
                    )}
                  </div>
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startOffset }, (_, i) => i).map(
                      (i) => (
                        <div key={`empty-${i}`} />
                      ),
                    )}
                    {calendarDays.map((day) => {
                      const isToday = isSameDay(day.date, new Date());
                      const dotColor = day.hasData
                        ? day.pnl > 0
                          ? "bg-emerald-500"
                          : "bg-red-500"
                        : "";
                      return (
                        <div
                          key={day.date.toISOString()}
                          data-ocid="calendar-day"
                          title={
                            day.hasData
                              ? `${day.count} trade${day.count !== 1 ? "s" : ""} · P&L: ${day.pnl >= 0 ? "+" : ""}$${day.pnl.toFixed(2)}`
                              : "No trades"
                          }
                          className={[
                            "relative rounded-md p-1.5 min-h-10 flex flex-col items-center justify-center",
                            "text-xs cursor-default transition-smooth",
                            isToday
                              ? "ring-1 ring-primary bg-primary/10"
                              : "hover:bg-muted/50",
                            day.hasData ? "bg-muted/30" : "",
                          ]
                            .join(" ")
                            .trim()}
                        >
                          <span
                            className={`font-medium ${isToday ? "text-primary" : "text-foreground"}`}
                          >
                            {format(day.date, "d")}
                          </span>
                          {day.hasData && (
                            <>
                              <span
                                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`}
                              />
                              <span
                                className={`text-[9px] font-mono mt-0.5 ${day.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
                              >
                                {day.pnl >= 0 ? "+" : ""}
                                {day.pnl.toFixed(0)}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Profit day
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      Loss day
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
                      No trades
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
