import { Button } from "../components/ui/button";
import { api } from "../lib/api";
import { authStore } from "../lib/auth";
import { isApiError } from "../lib/api";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, ShieldCheck, TrendingUp, Zap, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

type SignInForm = {
  email: string;
  password: string;
};

type SignInErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function SignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SignInForm>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignInErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof SignInForm, boolean>>
  >({});
  const testEmail = "testapp@example.com";
  const testPassword = "testing@123";

  const applyServerError = (error: unknown) => {
    if (!isApiError(error)) {
      setErrors({
        form: error instanceof Error ? error.message : "Sign in failed",
      });
      return;
    }

    const message = error.payload.message ?? "Sign in failed";
    const fieldErrors = error.payload.issues?.fieldErrors;

    if (message === "Invalid credentials") {
      setErrors({
        password: "Invalid email or password.",
        form: "Invalid email or password.",
      });
      return;
    }

    setErrors({
      email: fieldErrors?.email?.[0],
      password: fieldErrors?.password?.[0],
      form: error.payload.issues?.formErrors?.[0] ?? message,
    });
  };

  const loginMutation = useMutation({
    mutationFn: api.login,
    onMutate: () => {
      toast.loading("Signing you in...", { id: "signin-request" });
    },
    onSuccess: (session) => {
      toast.dismiss("signin-request");
      authStore.setAuth(session);
      setErrors({});
      toast.success(`Welcome back, ${session.user.firstName}.`, {
        id: "signin-success",
      });
      void navigate({ to: "/" });
    },
    onError: (error) => {
      toast.dismiss("signin-request");
      applyServerError(error);
      toast.error(
        isApiError(error)
          ? (error.payload.message ?? "Sign in failed")
          : error instanceof Error
            ? error.message
            : "Sign in failed",
        { id: "signin-error" },
      );
    },
  });

  const isLoading = loginMutation.isPending;

  const validateForm = (values: SignInForm): SignInErrors => {
    const nextErrors: SignInErrors = {};
    const email = values.email.trim();

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!values.password) {
      nextErrors.password = "Password is required.";
    } else if (values.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    return nextErrors;
  };

  const validateField = (field: keyof SignInForm, values: SignInForm) =>
    validateForm(values)[field];

  const updateField = (field: keyof SignInForm, value: string) => {
    setForm((current) => {
      const nextForm = { ...current, [field]: value };

      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: touched[field] ? validateField(field, nextForm) : undefined,
        form: undefined,
      }));

      return nextForm;
    });
  };

  const handleBlur = (field: keyof SignInForm) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({
      ...current,
      [field]: validateField(field, form),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    await loginMutation.mutateAsync({
      email: form.email.trim(),
      password: form.password,
    });
  };

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

            <Link
              className="font-display text-2xl font-bold"
              style={{ color: "oklch(0.96 0 0)" }}
              to="/"
            >
              Edgerift Metrics
            </Link>
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
              Sign in to your Edgerift Metrics account to continue tracking your
              edge.
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

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                onBlur={() => handleBlur("email")}
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  onBlur={() => handleBlur("password")}
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
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
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
              className="w-full font-display font-semibold text-base mt-2 relative overflow-hidden transition-smooth cursor-pointer"
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

            {/* Test user login button */}
            <div className="mt-3">
              <Button
                type="button"
                size="lg"
                className="w-full font-display font-semibold text-base relative overflow-hidden transition-smooth cursor-pointer"
                style={{
                  background: isLoading
                    ? "oklch(0.60 0.18 262)"
                    : "oklch(0.55 0.18 167)",
                  color: "oklch(0.09 0 0)",
                  boxShadow: "0 0 20px oklch(0.55 0.18 167 / 0.20)",
                }}
                disabled={isLoading}
                onClick={() => {
                  loginMutation.mutate({
                    email: testEmail,
                    password: testPassword,
                  });
                }}
                data-ocid="signin.test_login_button"
              >
                <LogIn className="mr-2 w-5 h-5" />
                {isLoading ? "Signing in…" : "Login with test creds"}
              </Button>
            </div>
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
            New to Edgerift Metrics?{" "}
            <button
              type="button"
              onClick={() => navigate({ to: "/signup" })}
              className="font-semibold transition-smooth hover:underline cursor-pointer"
              style={{ color: "oklch(0.78 0.21 262)" }}
              data-ocid="signin.signup_link"
            >
              Create an account
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
