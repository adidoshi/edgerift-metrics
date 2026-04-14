import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";
import { Direction, type Trade } from "../types/trading";
import {
  Calendar,
  Clock,
  DollarSign,
  Tag,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

interface TradeDetailModalProps {
  trade: Trade;
  onClose: () => void;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function pnlColor(val: number) {
  if (val > 0) return "text-emerald-400 font-semibold";
  if (val < 0) return "text-rose-400 font-semibold";
  return "text-muted-foreground";
}

function formatPnl(val: number) {
  const sign = val > 0 ? "+" : "";
  return `${sign}$${val.toFixed(2)}`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0 pt-0.5 w-32">
        {label}
      </span>
      <span className="text-sm text-foreground text-right break-words min-w-0">
        {value}
      </span>
    </div>
  );
}

export const TradeDetailModal = ({ trade, onClose }: TradeDetailModalProps) => {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="trade-detail-modal"
      >
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl font-bold">
              {trade.pair}
              <span className="ml-2 text-sm text-muted-foreground font-body font-normal">
                {trade.instrument}
              </span>
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
              data-ocid="modal-close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {trade.direction === Direction.Buy ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-xs">
                BUY
              </Badge>
            ) : (
              <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono text-xs">
                SELL
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {trade.session} Session
            </span>
          </div>
        </DialogHeader>

        <Separator className="bg-border/60" />

        {/* P&L overview */}
        <div className="grid grid-cols-3 gap-3 py-3">
          {[
            {
              label: "Net P&L",
              value: formatPnl(trade.netPnL),
              color: pnlColor(trade.netPnL),
              icon: DollarSign,
            },
            {
              label: "Gross P&L",
              value: formatPnl(trade.grossPnL),
              color: pnlColor(trade.grossPnL),
              icon: TrendingUp,
            },
            {
              label: "R Multiple",
              value: `${trade.rMultiple > 0 ? "+" : ""}${trade.rMultiple.toFixed(2)}R`,
              color:
                trade.rMultiple > 0
                  ? "text-emerald-400 font-semibold"
                  : "text-rose-400 font-semibold",
              icon: Target,
            },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="bg-muted/30 rounded-lg p-3 text-center border border-border/50"
            >
              <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className={`text-base font-mono ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                {label}
              </p>
            </div>
          ))}
        </div>

        <Separator className="bg-border/60" />

        {/* Trade details */}
        <div className="space-y-0 divide-y divide-border/30">
          <InfoRow
            label="Entry"
            value={
              <span className="flex items-center gap-1.5 justify-end">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                {formatDate(trade.startDateTime)}
              </span>
            }
          />
          <InfoRow
            label="Exit"
            value={
              <span className="flex items-center gap-1.5 justify-end">
                <Clock className="w-3 h-3 text-muted-foreground" />
                {formatDate(trade.endDateTime)}
              </span>
            }
          />
          {trade.strategy && (
            <InfoRow label="Strategy" value={trade.strategy} />
          )}
          {trade.model && <InfoRow label="Model" value={trade.model} />}
        </div>

        {/* Tags */}
        {trade.tags.length > 0 && (
          <>
            <Separator className="bg-border/60" />
            <div className="py-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trade.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Rules followed */}
        {trade.rulesFollowed.length > 0 && (
          <>
            <Separator className="bg-border/60" />
            <div className="py-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Rules Followed
              </p>
              <ul className="space-y-1">
                {trade.rulesFollowed.map((rule) => (
                  <li
                    key={rule}
                    className="text-xs text-foreground flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Trade idea & comments */}
        {(trade.tradeIdea || trade.comments) && (
          <>
            <Separator className="bg-border/60" />
            <div className="space-y-3 py-2">
              {trade.tradeIdea && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Trade Idea
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {trade.tradeIdea}
                  </p>
                </div>
              )}
              {trade.comments && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Comments
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {trade.comments}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Chart image */}
        {trade.chartImageUrl && (
          <>
            <Separator className="bg-border/60" />
            <div className="py-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Chart Screenshot
              </p>
              <img
                src={trade.chartImageUrl}
                alt="Trade chart"
                className="w-full rounded-lg border border-border object-cover"
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
