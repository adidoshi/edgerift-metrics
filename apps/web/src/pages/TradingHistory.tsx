import { Layout } from "../components/Layout";
import { api, isApiError } from "../lib/api";
import { TradeDetailModal } from "../components/TradeDetailModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Direction, Instrument, type Trade } from "../types/trading";
import {
  ArrowUpDown,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Filter,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

type SortKey = "startDateTime" | "netPnL" | "rMultiple";
type SortDir = "asc" | "desc";

interface FilterState {
  instrument: "All" | Instrument;
  search: string;
  dateFrom: string;
  dateTo: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function pnlColor(val: number) {
  if (val > 0) return "text-emerald-400 font-mono font-semibold";
  if (val < 0) return "text-rose-400 font-mono font-semibold";
  return "text-muted-foreground font-mono";
}

function formatPnl(val: number) {
  const sign = val > 0 ? "+" : "";
  return `${sign}$${val.toFixed(2)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortButton({
  label,
  sortKey,
  current,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  direction: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150 group"
      data-ocid={`sort-${sortKey}`}
    >
      {label}
      <span className="opacity-60 group-hover:opacity-100 transition-opacity">
        {isActive ? (
          direction === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3" />
        )}
      </span>
    </button>
  );
}

function DirectionBadge({ dir }: { dir: Direction }) {
  return dir === Direction.Buy ? (
    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-xs px-2 py-0.5">
      BUY
    </Badge>
  ) : (
    <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono text-xs px-2 py-0.5">
      SELL
    </Badge>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 gap-5 text-center"
      data-ocid="empty-state"
    >
      <div className="rounded-2xl bg-muted/40 border border-border p-6 w-20 h-20 flex items-center justify-center">
        <BookOpen className="w-9 h-9 text-muted-foreground" />
      </div>
      <div>
        <p className="text-lg font-display font-semibold text-foreground mb-1">
          No trades yet
        </p>
        <p className="text-sm text-muted-foreground">
          Start journaling to see your trade history here.
        </p>
      </div>
      <Button asChild variant="default" size="sm" data-ocid="empty-state-cta">
        <a href="/journal">Go to Journal</a>
      </Button>
    </motion.div>
  );
}

const LOADING_ROW_KEYS = [
  "r0",
  "r1",
  "r2",
  "r3",
  "r4",
  "r5",
  "r6",
  "r7",
] as const;
const LOADING_CELL_KEYS = [
  "c0",
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
] as const;

function LoadingRows() {
  return (
    <>
      {LOADING_ROW_KEYS.map((rk) => (
        <TableRow key={rk} className="border-border/50">
          {LOADING_CELL_KEYS.map((ck) => (
            <TableCell key={ck} className="py-3">
              <Skeleton className="h-4 w-full rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function DeleteButton({
  trade,
  isDeleting,
  onDelete,
}: {
  trade: Trade;
  isDeleting: boolean;
  onDelete: (trade: Trade) => Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150"
          data-ocid="delete-trade-trigger"
          aria-label="Delete trade"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className="bg-card border-border"
        data-ocid="delete-confirm-dialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            Delete Trade?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm">
            This will permanently remove the{" "}
            <span className="text-foreground font-medium">{trade.pair}</span>{" "}
            trade from your journal. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-border text-foreground hover:bg-muted"
            data-ocid="delete-cancel"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void onDelete(trade);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white"
            disabled={isDeleting}
            data-ocid="delete-confirm"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const INSTRUMENT_FILTERS: Array<"All" | Instrument> = [
  "All",
  Instrument.Forex,
  Instrument.Commodity,
  Instrument.Index,
];

export const TradingHistory = () => {
  const queryClient = useQueryClient();
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: api.getTrades,
  });

  const [sortKey, setSortKey] = useState<SortKey>("startDateTime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    instrument: "All",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);

  const deleteTrade = useMutation({
    mutationFn: api.deleteTrade,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trades"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "overview"] }),
      ]);
    },
  });

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function setFilter<K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({ instrument: "All", search: "", dateFrom: "", dateTo: "" });
    setPage(1);
  }

  async function handleDeleteTrade(trade: Trade) {
    try {
      setDeletingTradeId(trade.id);
      toast.loading(`Deleting ${trade.pair} trade...`, {
        id: `delete-trade-${trade.id}`,
      });
      await deleteTrade.mutateAsync(trade.id);
      if (selectedTrade?.id === trade.id) {
        setSelectedTrade(null);
      }
      toast.success(`${trade.pair} trade deleted successfully.`, {
        id: `delete-trade-${trade.id}`,
      });
    } catch (error) {
      toast.dismiss(`delete-trade-${trade.id}`);
      toast.error(
        isApiError(error)
          ? (error.payload.message ?? "Failed to delete trade.")
          : error instanceof Error
            ? error.message
            : "Failed to delete trade.",
      );
    } finally {
      setDeletingTradeId(null);
    }
  }

  const hasActiveFilters =
    filters.instrument !== "All" ||
    filters.search !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  const filtered = useMemo(() => {
    let result = [...trades];

    if (filters.instrument !== "All") {
      result = result.filter((t) => t.instrument === filters.instrument);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.pair.toLowerCase().includes(q) ||
          t.strategy.toLowerCase().includes(q) ||
          t.session.toLowerCase().includes(q) ||
          t.model.toLowerCase().includes(q),
      );
    }

    if (filters.dateFrom) {
      const fromMs = new Date(filters.dateFrom).getTime();
      result = result.filter(
        (t) => Number(t.startDateTime / 1_000_000n) >= fromMs,
      );
    }
    if (filters.dateTo) {
      const toMs = new Date(filters.dateTo).getTime() + 86_400_000;
      result = result.filter(
        (t) => Number(t.startDateTime / 1_000_000n) <= toMs,
      );
    }

    result.sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === "startDateTime") {
        av = Number(a.startDateTime);
        bv = Number(b.startDateTime);
      } else if (sortKey === "netPnL") {
        av = a.netPnL;
        bv = b.netPnL;
      } else {
        av = a.rMultiple;
        bv = b.rMultiple;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return result;
  }, [trades, filters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-5">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            Trading History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Loading…"
              : `${filtered.length} trade${filtered.length !== 1 ? "s" : ""}${hasActiveFilters ? " (filtered)" : ""}`}
          </p>
        </motion.div>

        {/* Filters bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.07 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3"
          data-ocid="filters-bar"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search pair, strategy, session…"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                className="pl-9 bg-background border-input text-sm"
                data-ocid="search-input"
              />
            </div>
            {/* Date range */}
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
              className="bg-background border-input text-sm w-full sm:w-36"
              data-ocid="date-from"
              aria-label="From date"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter("dateTo", e.target.value)}
              className="bg-background border-input text-sm w-full sm:w-36"
              data-ocid="date-to"
              aria-label="To date"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {INSTRUMENT_FILTERS.map((inst) => (
              <button
                type="button"
                key={inst}
                onClick={() => setFilter("instrument", inst)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors duration-150 font-medium ${
                  filters.instrument === inst
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
                data-ocid={`filter-${inst.toLowerCase()}`}
              >
                {inst}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs px-2 py-1 rounded-full text-muted-foreground hover:text-rose-400 flex items-center gap-1 transition-colors duration-150"
                data-ocid="clear-filters"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
          data-ocid="trades-table-container"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 pl-4 w-36">
                    <SortButton
                      label="Date / Time"
                      sortKey="startDateTime"
                      current={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">
                    Instrument
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">
                    Pair
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">
                    Direction
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">
                    <SortButton
                      label="R Multiple"
                      sortKey="rMultiple"
                      current={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">
                    Gross P&amp;L
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">
                    <SortButton
                      label="Net P&L"
                      sortKey="netPnL"
                      current={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">
                    Session
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 hidden xl:table-cell">
                    Strategy
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 pr-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <LoadingRows />
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="p-0">
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((trade, i) => (
                    <TableRow
                      key={trade.id}
                      className="border-border/40 hover:bg-muted/20 cursor-pointer transition-colors duration-100 group"
                      onClick={() => setSelectedTrade(trade)}
                      data-ocid={`trade-row-${i}`}
                    >
                      <TableCell className="py-3 pl-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {formatDate(trade.startDateTime)}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border font-medium">
                          {trade.instrument}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-sm font-semibold text-foreground">
                        {trade.pair}
                      </TableCell>
                      <TableCell className="py-3">
                        <DirectionBadge dir={trade.direction} />
                      </TableCell>
                      <TableCell className="py-3 font-mono text-sm text-foreground">
                        {trade.rMultiple > 0 ? "+" : ""}
                        {trade.rMultiple.toFixed(2)}R
                      </TableCell>
                      <TableCell
                        className={`py-3 text-sm ${pnlColor(trade.grossPnL)}`}
                      >
                        {formatPnl(trade.grossPnL)}
                      </TableCell>
                      <TableCell
                        className={`py-3 text-sm ${pnlColor(trade.netPnL)}`}
                      >
                        {formatPnl(trade.netPnL)}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {trade.session}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground hidden xl:table-cell max-w-35 truncate">
                        {trade.strategy || "—"}
                      </TableCell>
                      <TableCell
                        className="py-3 pr-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-150"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrade(trade);
                            }}
                            aria-label="View trade details"
                            data-ocid="view-trade-trigger"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <DeleteButton
                            trade={trade}
                            isDeleting={deletingTradeId === trade.id}
                            onDelete={handleDeleteTrade}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} &middot; {filtered.length} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 border-border text-muted-foreground"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-ocid="pagination-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-foreground font-mono min-w-12 text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 border-border text-muted-foreground"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-ocid="pagination-next"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}
    </Layout>
  );
};
