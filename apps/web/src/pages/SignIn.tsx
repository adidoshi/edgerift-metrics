import { Button } from "../components/ui/button";
// import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { LogIn, ShieldCheck, TrendingUp, Zap, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
// import { useEffect } from "react";

export default function SignIn() {
  const navigate = useNavigate();
  //   const { login, identity, isLoggingIn } = useInternetIdentity();

  // Redirect if already authenticated
  //   useEffect(() => {
  //     if (identity) {
  //       navigate({ to: "/" });
  //     }
  //   }, [identity, navigate]);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});

  const isLoading = false;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 20% 30%, oklch(0.72 0.21 262 / 0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 70%, oklch(0.78 0.26 167 / 0.10) 0%, transparent 55%), oklch(0.09 0 0)",
      }}
    >
      {/* Decorative grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.80 0.25 262) 1px, transparent 1px), linear-gradient(90deg, oklch(0.80 0.25 262) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating orbs */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ background: "oklch(0.72 0.21 262)" }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-8"
        style={{ background: "oklch(0.78 0.26 167)" }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo mark */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "oklch(0.72 0.21 262 / 0.2)",
                border: "1px solid oklch(0.72 0.21 262 / 0.4)",
                boxShadow: "0 0 24px oklch(0.72 0.21 262 / 0.25)",
              }}
            >
              <TrendingUp
                className="w-6 h-6"
                style={{ color: "oklch(0.80 0.25 262)" }}
              />
            </div>
            <span
              className="font-display text-2xl font-bold"
              style={{ color: "oklch(0.96 0 0)" }}
            >
              TradeFlow
            </span>
          </div>
          <p className="font-mono text-xs" style={{ color: "oklch(0.62 0 0)" }}>
            Professional Trading Analytics
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="rounded-2xl p-8 backdrop-blur-md"
          style={{
            background: "oklch(0.13 0 0 / 0.85)",
            border: "1px solid oklch(0.72 0.21 262 / 0.25)",
            boxShadow:
              "0 0 40px oklch(0.72 0.21 262 / 0.08), 0 24px 48px oklch(0 0 0 / 0.4)",
          }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h1
              className="font-display text-2xl font-bold mb-2"
              style={{ color: "oklch(0.96 0 0)" }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "oklch(0.62 0 0)" }}>
              Sign in to your TradeFlow account to continue tracking your edge.
            </p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: ShieldCheck, label: "Secure" },
              { icon: Zap, label: "Instant" },
              { icon: TrendingUp, label: "Persistent" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-lg py-3"
                style={{
                  background: "oklch(0.18 0 0 / 0.8)",
                  border: "1px solid oklch(0.24 0 0)",
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.21 262)" }}
                />
                <span
                  className="font-mono text-xs"
                  style={{ color: "oklch(0.55 0 0)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Internet Identity button */}
          <form onSubmit={() => {}} className="space-y-5" noValidate>
            {/* Form-level error */}
            {errors.form && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "oklch(0.55 0.27 22 / 0.15)",
                  border: "1px solid oklch(0.55 0.27 22 / 0.4)",
                  color: "oklch(0.75 0.2 22)",
                }}
                data-ocid="signin.error_state"
              >
                {errors.form}
              </motion.div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="signin-email"
                className="text-sm font-medium"
                style={{ color: "oklch(0.75 0 0)" }}
              >
                Email address
              </Label>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={""}
                onChange={() => {}}
                className="h-11"
                style={{
                  background: "oklch(0.18 0 0)",
                  border: errors.email
                    ? "1px solid oklch(0.65 0.27 22 / 0.8)"
                    : "1px solid oklch(0.28 0 0)",
                  color: "oklch(0.94 0 0)",
                }}
                data-ocid="signin.email_input"
              />
              {errors.email && (
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.70 0.22 22)" }}
                  data-ocid="signin.email.field_error"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="signin-password"
                className="text-sm font-medium"
                style={{ color: "oklch(0.75 0 0)" }}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={""}
                  onChange={() => {}}
                  className="h-11 pr-10"
                  style={{
                    background: "oklch(0.18 0 0)",
                    border: errors.password
                      ? "1px solid oklch(0.65 0.27 22 / 0.8)"
                      : "1px solid oklch(0.28 0 0)",
                    color: "oklch(0.94 0 0)",
                  }}
                  data-ocid="signin.password_input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "oklch(0.48 0 0)" }}
                  onClick={() => {}}
                  aria-label={false ? "Hide password" : "Show password"}
                >
                  {false ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.70 0.22 22)" }}
                  data-ocid="signin.password.field_error"
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full font-display font-semibold text-base mt-2 relative overflow-hidden transition-smooth"
              style={{
                background: isLoading
                  ? "oklch(0.60 0.18 262)"
                  : "oklch(0.72 0.21 262)",
                color: "oklch(0.09 0 0)",
                boxShadow: "0 0 20px oklch(0.72 0.21 262 / 0.30)",
              }}
              disabled={isLoading}
              data-ocid="signin.submit_button"
            >
              <LogIn className="mr-2 w-5 h-5" />
              {isLoading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(0.22 0 0)" }}
            />
            <span
              className="font-mono text-xs"
              style={{ color: "oklch(0.42 0 0)" }}
            >
              or
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(0.22 0 0)" }}
            />
          </div>

          {/* Sign up link */}
          <p
            className="text-center text-sm"
            style={{ color: "oklch(0.55 0 0)" }}
          >
            New to TradeFlow?{" "}
            <button
              type="button"
              onClick={() => navigate({ to: "/signup" })}
              className="font-semibold transition-smooth hover:underline"
              style={{ color: "oklch(0.78 0.21 262)" }}
              data-ocid="signin.signup_link"
            >
              Create an account
            </button>
          </p>
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-center mt-6 text-xs"
          style={{ color: "oklch(0.38 0 0)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Powered by{" "}
          <span style={{ color: "oklch(0.62 0 0)" }}>Internet Identity</span> —
          no passwords, no email, fully sovereign.
        </motion.p>
      </div>
    </div>
  );
}
