import { Card, CardContent, CardTitle } from "@edgerift/ui";
import type { AnalyticsOverview } from "@edgerift/contracts";

type Props = {
  overview: AnalyticsOverview;
};

export const OverviewCards = ({ overview }: Props) => {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardTitle>Total Trades</CardTitle>
        <CardContent>
          <p className="text-2xl font-semibold">{overview.totalTrades}</p>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>Total PnL</CardTitle>
        <CardContent>
          <p className="text-2xl font-semibold">
            {overview.totalPnl.toFixed(2)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>Wins / Losses</CardTitle>
        <CardContent>
          <p className="text-2xl font-semibold">
            {overview.wins} / {overview.losses}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>Win Rate</CardTitle>
        <CardContent>
          <p className="text-2xl font-semibold">{overview.winRate}%</p>
        </CardContent>
      </Card>
    </section>
  );
};
