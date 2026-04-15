import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { authStore } from "./lib/auth";
import { Home } from "./pages/Home";
import { Journal } from "./pages/Journal";
import { Analytics } from "./pages/Analytics";
import { AiInsights } from "./pages/AiInsights";
import { TradingHistory } from "./pages/TradingHistory";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

const requireAuth = () => {
  if (!authStore.isAuthenticated()) {
    throw redirect({ to: "/signin" });
  }
};

const requireGuest = () => {
  if (authStore.isAuthenticated()) {
    throw redirect({ to: "/" });
  }
};

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
  beforeLoad: requireAuth,
  component: Journal,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  beforeLoad: requireAuth,
  component: Analytics,
});

const aiInsightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai-insights",
  beforeLoad: requireAuth,
  component: AiInsights,
});

const tradingHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trading-history",
  beforeLoad: requireAuth,
  component: TradingHistory,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin",
  beforeLoad: requireGuest,
  component: SignIn,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  beforeLoad: requireGuest,
  component: SignUp,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  journalRoute,
  analyticsRoute,
  aiInsightsRoute,
  tradingHistoryRoute,
  signInRoute,
  signUpRoute,
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
