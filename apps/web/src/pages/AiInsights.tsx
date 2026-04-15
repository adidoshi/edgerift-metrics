import type {
  MentorReportPeriod,
  MentorReportResponse,
} from "@edgerift/contracts";
import { Layout } from "../components/Layout";
import { api, isApiError } from "../lib/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subDays } from "date-fns";
import { BarChart2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Trade } from "../types/trading";

const MINIMUM_TRADES_FOR_MENTOR_REPORT = 10;
const MAX_MENTOR_REPORTS_PER_DAY = 5;

function getMentorReportPeriodStart(period: MentorReportPeriod, now: Date) {
  if (period === "month") {
    return startOfMonth(now);
  }

  return subDays(now, 6);
}

function isTradeEligibleForMentorReport(
  trade: Trade,
  period: MentorReportPeriod,
  now: Date,
) {
  const tradeDate = new Date(Number(trade.startDateTime) / 1_000_000);
  return (
    tradeDate >= getMentorReportPeriodStart(period, now) && tradeDate <= now
  );
}

function formatReportTimestamp(value: string) {
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

function MentorshipList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2 leading-relaxed">
            <span className="mt-1.75 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const AiInsights = () => {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: api.getTrades,
  });
  const [reportPeriod, setReportPeriod] = useState<MentorReportPeriod>("month");
  const [mentorReportResult, setMentorReportResult] = useState<{
    period: MentorReportPeriod;
    data: MentorReportResponse;
  } | null>(null);

  const eligibleTradeCount = trades.filter((trade) =>
    isTradeEligibleForMentorReport(trade, reportPeriod, new Date()),
  ).length;
  const canGenerateMentorReport =
    eligibleTradeCount >= MINIMUM_TRADES_FOR_MENTOR_REPORT;

  const generateMentorReportMutation = useMutation({
    mutationFn: api.generateMentorReport,
    onMutate: () => {
      toast.loading("Generating your AI mentor report...", {
        id: "mentor-report-generate",
      });
    },
    onSuccess: (result, variables) => {
      toast.dismiss("mentor-report-generate");
      setMentorReportResult({
        period: variables.period,
        data: result,
      });
      toast.success("AI mentor report ready.", {
        id: "mentor-report-success",
      });
    },
    onError: (error) => {
      toast.dismiss("mentor-report-generate");
      toast.error(
        isApiError(error)
          ? (error.payload.message ?? "Failed to generate AI report")
          : error instanceof Error
            ? error.message
            : "Failed to generate AI report",
        {
          id: "mentor-report-error",
        },
      );
    },
  });

  const handleGenerateMentorReport = () => {
    if (!canGenerateMentorReport) {
      toast.error(
        `You need at least ${MINIMUM_TRADES_FOR_MENTOR_REPORT} trades in this ${reportPeriod} period before generating a report.`,
        {
          id: "mentor-report-minimum-trades",
        },
      );
      return;
    }

    generateMentorReportMutation.mutate({ period: reportPeriod });
  };

  const mentorReport = mentorReportResult?.data.report;
  const mentorUsage = mentorReportResult?.data.usage;
  const mentorStatusToneClass =
    mentorReport?.performanceStatus === "profitable"
      ? "border-emerald-500/40 text-emerald-300"
      : mentorReport?.performanceStatus === "losing"
        ? "border-red-500/40 text-red-300"
        : mentorReport?.performanceStatus === "breakeven"
          ? "border-amber-500/40 text-amber-300"
          : "border-primary/40 text-primary";

  return (
    <Layout>
      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-350 mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              AI Insights
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Mentor-style coaching based on your recent trading performance
            </p>
          </div>
          {!isLoading && trades.length > 0 && (
            <Badge
              variant="outline"
              className="text-xs border-primary/40 text-primary"
              data-ocid="ai-live-badge"
            >
              Live Data
            </Badge>
          )}
        </div>

        <Card className="bg-card border-border" data-ocid="mentor-report-card">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  AI Mentor Report
                </CardTitle>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
                  Generate a coaching report for your recent performance. The AI
                  uses your logged trades to explain what likely went right,
                  what likely went wrong, and what to do next.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
                  {(["week", "month"] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setReportPeriod(period)}
                      className={[
                        "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-smooth",
                        reportPeriod === period
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateMentorReport}
                  disabled={
                    generateMentorReportMutation.isPending ||
                    !canGenerateMentorReport
                  }
                >
                  {generateMentorReportMutation.isPending
                    ? "Generating..."
                    : "Generate AI Report"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-primary/30 text-primary"
              >
                {eligibleTradeCount} trade{eligibleTradeCount !== 1 ? "s" : ""}{" "}
                in selected period
              </Badge>
              <Badge
                variant="outline"
                className="border-border text-muted-foreground"
              >
                Minimum {MINIMUM_TRADES_FOR_MENTOR_REPORT} trades required
              </Badge>
              <Badge
                variant="outline"
                className="border-border text-muted-foreground"
              >
                Max {MAX_MENTOR_REPORTS_PER_DAY} new reports per day
              </Badge>
            </div>

            {!canGenerateMentorReport && (
              <p className="text-sm text-amber-300">
                Add {MINIMUM_TRADES_FOR_MENTOR_REPORT - eligibleTradeCount} more
                trade
                {MINIMUM_TRADES_FOR_MENTOR_REPORT - eligibleTradeCount !== 1
                  ? "s"
                  : ""}
                in this {reportPeriod} period to unlock the report.
              </p>
            )}

            {mentorReportResult && mentorReport && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/10 p-4 md:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={mentorStatusToneClass}
                      >
                        {mentorReport.performanceStatus}
                      </Badge>
                      {mentorReport.shouldTakeBreak && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 text-amber-300"
                        >
                          Break suggested
                        </Badge>
                      )}
                      {mentorReport.shouldPaperTrade && (
                        <Badge
                          variant="outline"
                          className="border-red-500/40 text-red-300"
                        >
                          Paper trading suggested
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-display font-semibold text-foreground">
                      {mentorReport.title}
                    </h2>
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {mentorReport.summary}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground lg:text-right">
                    <p>
                      Generated for the {mentorReportResult.period} view on{" "}
                      {formatReportTimestamp(
                        mentorReportResult.data.generatedAt,
                      )}
                    </p>
                    <p>
                      Period:{" "}
                      {formatReportTimestamp(
                        mentorReportResult.data.periodStart,
                      )}{" "}
                      to{" "}
                      {formatReportTimestamp(mentorReportResult.data.periodEnd)}
                    </p>
                    {mentorUsage && (
                      <p>
                        {mentorUsage.reportsRemainingToday} of{" "}
                        {MAX_MENTOR_REPORTS_PER_DAY} new reports remaining today
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <MentorshipList
                    title="Key Drivers"
                    items={mentorReport.keyDrivers}
                  />
                  <MentorshipList
                    title="What Went Well"
                    items={mentorReport.whatWentWell}
                  />
                  <MentorshipList
                    title="What Went Wrong"
                    items={mentorReport.whatWentWrong}
                  />
                  <MentorshipList
                    title="Behavior Signals"
                    items={mentorReport.behaviorSignals}
                  />
                  <MentorshipList
                    title="Recommendations"
                    items={mentorReport.recommendations}
                  />
                  <MentorshipList
                    title="Next Steps"
                    items={mentorReport.nextSteps}
                  />
                </div>

                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Confidence note
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {mentorReport.confidenceNote}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
