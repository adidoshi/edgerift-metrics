import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Home } from "./pages/Home";
import { Journal } from "./pages/Journal";
import { Analytics } from "./pages/Analytics";
import { TradingHistory } from "./pages/TradingHistory";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const journalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/journal",
  component: Journal,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: Analytics,
});

const tradingHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trading-history",
  component: TradingHistory,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  journalRoute,
  analyticsRoute,
  tradingHistoryRoute,
]);

export const router = createRouter({
  routeTree,
});

export type AppRouter = typeof router;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
