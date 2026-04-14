// Mirror of backend Motoko types — kept in sync with backend.ts generated types

export const Instrument = {
  Forex: "Forex",
  Commodity: "Commodity",
  Index: "Index",
} as const;

export type Instrument = (typeof Instrument)[keyof typeof Instrument];

export const Direction = {
  Buy: "Buy",
  Sell: "Sell",
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

export interface Trade {
  id: string;
  startDateTime: bigint;
  endDateTime: bigint;
  instrument: Instrument;
  pair: string;
  direction: Direction;
  rMultiple: number;
  grossPnL: number;
  netPnL: number;
  tags: string[];
  session: string;
  strategy: string;
  model: string;
  tradeIdea: string;
  comments: string;
  rulesFollowed: string[];
  chartImageUrl?: string;
  createdAt: bigint;
}

export interface TradeInput {
  startDateTime: bigint;
  endDateTime: bigint;
  instrument: Instrument;
  pair: string;
  direction: Direction;
  rMultiple: number;
  grossPnL: number;
  netPnL: number;
  tags: string[];
  session: string;
  strategy: string;
  model: string;
  tradeIdea: string;
  comments: string;
  rulesFollowed: string[];
  chartImageUrl?: string;
}

export interface AccountSummary {
  totalTrades: bigint;
  winRate: number;
  totalPnL: number;
  currentBalance: number;
  tradingDays: bigint;
  startBalance: number;
}

export const FOREX_PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY"] as const;
export const COMMODITY_PAIRS = ["XAUUSD", "XAGUSD"] as const;
export const INDEX_PAIRS = ["NAS100", "US30"] as const;

export const PAIR_OPTIONS: Record<Instrument, string[]> = {
  [Instrument.Forex]: [...FOREX_PAIRS],
  [Instrument.Commodity]: [...COMMODITY_PAIRS],
  [Instrument.Index]: [...INDEX_PAIRS],
};

export const SESSION_OPTIONS = [
  "London",
  "New York",
  "Tokyo",
  "Sydney",
  "London/NY Overlap",
] as const;

export const TAG_OPTIONS = [
  "Trend Follow",
  "Reversal",
  "Breakout",
  "Range",
  "News Trade",
  "Scalp",
  "Swing",
  "HTF Confluence",
  "ICT Concept",
  "SMC",
] as const;

export const RULES_OPTIONS = [
  "Followed trading plan",
  "Respected risk management",
  "Waited for confirmation",
  "No revenge trading",
  "Proper position sizing",
  "Journaled before entry",
  "Checked news calendar",
] as const;
