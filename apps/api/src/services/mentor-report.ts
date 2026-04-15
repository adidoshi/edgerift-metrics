import OpenAI from "openai";
import {
  mentorReportSchema,
  type MentorReport,
  type MentorReportPeriod,
} from "@edgerift/contracts";
import { env } from "../config/env.js";

type TradeForReport = {
  entryAt: Date;
  exitAt: Date;
  pair: string;
  instrument: string;
  direction: string;
  session: string;
  strategy: string;
  model: string;
  netPnL: number;
  grossPnL: number;
  commissions?: number;
  swapCharges?: number;
  rMultiple: number;
  rulesFollowed?: string[];
  tags?: string[];
  tradeIdea?: string;
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type SummaryInput = {
  period: MentorReportPeriod;
  startBalance: number;
  trades: TradeForReport[];
};

type PeriodRange = {
  start: Date;
  end: Date;
};

type ReportSummary = ReturnType<typeof buildMentorReportSummary>;

const REPORTS_PER_DAY_LIMIT = 5;
const MINIMUM_TRADES_REQUIRED = 10;

let openAiClient: OpenAI | null = null;

const getOpenAiClient = () => {
  if (!env.openAiApiKey) {
    throw new Error("AI reporting is not configured");
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: env.openAiApiKey });
  }

  return openAiClient;
};

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const startOfMonth = (value: Date) => {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value: Date, amount: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const round = (value: number) => Number(value.toFixed(2));

const sumBy = <T>(values: T[], select: (value: T) => number) =>
  values.reduce((sum, value) => sum + select(value), 0);

const sortByEntryAt = (trades: TradeForReport[]) =>
  [...trades].sort(
    (left, right) => left.entryAt.getTime() - right.entryAt.getTime(),
  );

const calculateMaxStreak = (
  trades: TradeForReport[],
  predicate: (trade: TradeForReport) => boolean,
) => {
  let current = 0;
  let max = 0;

  for (const trade of sortByEntryAt(trades)) {
    if (predicate(trade)) {
      current += 1;
      if (current > max) {
        max = current;
      }
      continue;
    }

    current = 0;
  }

  return max;
};

const buildDistribution = (
  trades: TradeForReport[],
  select: (trade: TradeForReport) => string,
) => {
  const counts = new Map<string, { count: number; pnl: number }>();

  for (const trade of trades) {
    const key = select(trade).trim() || "Unknown";
    const entry = counts.get(key) ?? { count: 0, pnl: 0 };
    entry.count += 1;
    entry.pnl += trade.netPnL;
    counts.set(key, entry);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({
      label,
      count: value.count,
      pnl: round(value.pnl),
    }))
    .sort((left, right) => right.count - left.count || right.pnl - left.pnl);
};

const getPeriodRange = (
  period: MentorReportPeriod,
  now = new Date(),
): PeriodRange => {
  if (period === "month") {
    return {
      start: startOfMonth(now),
      end: endOfDay(now),
    };
  }

  return {
    start: startOfDay(addDays(now, -6)),
    end: endOfDay(now),
  };
};

const buildMentorReportSummary = ({
  period,
  startBalance,
  trades,
}: SummaryInput) => {
  const sortedTrades = sortByEntryAt(trades);
  const wins = sortedTrades.filter((trade) => trade.netPnL > 0);
  const losses = sortedTrades.filter((trade) => trade.netPnL < 0);
  const breakevenTrades = sortedTrades.length - wins.length - losses.length;
  const totalPnl = sumBy(sortedTrades, (trade) => trade.netPnL);
  const grossProfit = sumBy(wins, (trade) => trade.netPnL);
  const grossLoss = Math.abs(sumBy(losses, (trade) => trade.netPnL));
  const averageWin = average(wins.map((trade) => trade.netPnL));
  const averageLoss = Math.abs(average(losses.map((trade) => trade.netPnL)));
  const averageR = average(sortedTrades.map((trade) => trade.rMultiple));
  const tradingDates = unique(
    sortedTrades.map((trade) => formatDate(trade.entryAt)),
  );
  const tradingDays = tradingDates.length;
  const averageTradesPerDay =
    tradingDays > 0 ? sortedTrades.length / tradingDays : sortedTrades.length;
  const dailyDistribution = buildDistribution(sortedTrades, (trade) =>
    formatDate(trade.entryAt),
  );
  const overtradingDays = dailyDistribution.filter(
    (day) => day.count >= 4,
  ).length;
  const sessionDistribution = buildDistribution(
    sortedTrades,
    (trade) => trade.session,
  );
  const pairDistribution = buildDistribution(
    sortedTrades,
    (trade) => trade.pair,
  );
  const strategyDistribution = buildDistribution(
    sortedTrades,
    (trade) => trade.strategy,
  );
  const tagsUsed = unique(sortedTrades.flatMap((trade) => trade.tags ?? []));
  const totalRulesMentioned = sumBy(
    sortedTrades,
    (trade) => (trade.rulesFollowed ?? []).length,
  );
  const ruleFollowRate =
    sortedTrades.length > 0 ? totalRulesMentioned / sortedTrades.length : 0;
  const latestTrade = sortedTrades.at(-1);
  const earliestTrade = sortedTrades.at(0);
  const equityEnd = round(startBalance + totalPnl);
  const biggestWin = wins.reduce(
    (best, trade) => (trade.netPnL > best.netPnL ? trade : best),
    wins[0] ?? null,
  );
  const biggestLoss = losses.reduce(
    (worst, trade) => (trade.netPnL < worst.netPnL ? trade : worst),
    losses[0] ?? null,
  );
  const tradesWithComments = sortedTrades
    .filter((trade) => trade.comments?.trim() || trade.tradeIdea?.trim())
    .slice(-8)
    .map((trade) => ({
      date: trade.entryAt.toISOString(),
      pair: trade.pair,
      pnl: round(trade.netPnL),
      rMultiple: round(trade.rMultiple),
      tradeIdea: trade.tradeIdea?.trim() || undefined,
      comments: trade.comments?.trim() || undefined,
      rulesFollowed: trade.rulesFollowed ?? [],
    }));

  return {
    period,
    periodLabel: period === "week" ? "last 7 days" : "current month",
    dateRange: {
      start: earliestTrade?.entryAt.toISOString() ?? new Date().toISOString(),
      end: latestTrade?.exitAt.toISOString() ?? new Date().toISOString(),
    },
    tradeCount: sortedTrades.length,
    totalPnl: round(totalPnl),
    startBalance: round(startBalance),
    endingBalance: equityEnd,
    winRate:
      sortedTrades.length > 0
        ? round((wins.length / sortedTrades.length) * 100)
        : 0,
    wins: wins.length,
    losses: losses.length,
    breakevenTrades,
    grossProfit: round(grossProfit),
    grossLoss: round(grossLoss),
    profitFactor:
      grossLoss > 0
        ? round(grossProfit / grossLoss)
        : grossProfit > 0
          ? null
          : 0,
    averageWin: round(averageWin),
    averageLoss: round(averageLoss),
    averageR: round(averageR),
    bestR:
      sortedTrades.length > 0
        ? round(Math.max(...sortedTrades.map((trade) => trade.rMultiple)))
        : 0,
    worstR:
      sortedTrades.length > 0
        ? round(Math.min(...sortedTrades.map((trade) => trade.rMultiple)))
        : 0,
    tradingDays,
    averageTradesPerDay: round(averageTradesPerDay),
    overtradingDays,
    maxWinStreak: calculateMaxStreak(sortedTrades, (trade) => trade.netPnL > 0),
    maxLossStreak: calculateMaxStreak(
      sortedTrades,
      (trade) => trade.netPnL < 0,
    ),
    ruleFollowRate: round(ruleFollowRate),
    sessionDistribution: sessionDistribution.slice(0, 5),
    pairDistribution: pairDistribution.slice(0, 5),
    strategyDistribution: strategyDistribution.slice(0, 5),
    tagsUsed: tagsUsed.slice(0, 12),
    biggestWin:
      biggestWin === null
        ? null
        : {
            pair: biggestWin.pair,
            session: biggestWin.session,
            pnl: round(biggestWin.netPnL),
            rMultiple: round(biggestWin.rMultiple),
          },
    biggestLoss:
      biggestLoss === null
        ? null
        : {
            pair: biggestLoss.pair,
            session: biggestLoss.session,
            pnl: round(biggestLoss.netPnL),
            rMultiple: round(biggestLoss.rMultiple),
          },
    recentTradeNotes: tradesWithComments,
  };
};

const buildPrompt = (summary: ReportSummary) => ({
  system: [
    "You are a trading performance mentor writing for a retail trader.",
    "Base the report only on the provided trading data and notes.",
    "Do not claim psychological causes such as fear, greed, revenge trading, or lack of discipline unless there is data that reasonably supports the inference.",
    "If evidence is weak, say that it is a possible pattern rather than a certainty.",
    "Be direct, specific, practical, and constructive.",
    "Return valid JSON only with the exact keys requested.",
  ].join(" "),
  user: JSON.stringify(
    {
      task: "Create a mentor report for this trader using the exact response shape requested.",
      responseShape: {
        title: "string",
        summary: "string",
        performanceStatus: "profitable | losing | breakeven | mixed",
        keyDrivers: ["string"],
        whatWentWell: ["string"],
        whatWentWrong: ["string"],
        behaviorSignals: ["string"],
        recommendations: ["string"],
        nextSteps: ["string"],
        shouldTakeBreak: true,
        shouldPaperTrade: false,
        confidenceNote: "string",
      },
      traderData: summary,
    },
    null,
    2,
  ),
});

export const mentorReportLimits = {
  reportsPerDay: REPORTS_PER_DAY_LIMIT,
  minimumTrades: MINIMUM_TRADES_REQUIRED,
} as const;

export const createMentorReport = async (
  summary: ReportSummary,
): Promise<MentorReport> => {
  const client = getOpenAiClient();
  const prompt = buildPrompt(summary);
  const completion = await client.chat.completions.create({
    model: env.openAiModel,
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty mentor report");
  }

  const parsed = JSON.parse(content) as unknown;
  return mentorReportSchema.parse(parsed);
};

export const mentorReportService = {
  buildSummary: buildMentorReportSummary,
  createReport: createMentorReport,
  getPeriodRange,
  limits: mentorReportLimits,
  startOfToday: () => startOfDay(new Date()),
};
