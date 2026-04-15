import { Button } from "../components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { api, isApiError } from "../lib/api";
import { authStore } from "../lib/auth";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

const PERKS = [
  {
    icon: BookOpen,
    label: "Trade Journaling",
    desc: "Log every trade with full context",
  },
  {
    icon: BarChart3,
    label: "Analytics Dashboard",
    desc: "Interactive equity curves & win rate",
  },
  {
    icon: Calendar,
    label: "Calendar View",
    desc: "Spot your best & worst trading days",
  },
  {
    icon: TrendingUp,
    label: "Performance Tracking",
    desc: "Consistency score & R-multiple stats",
  },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export default function SignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  const applyServerError = (error: unknown) => {
    if (!isApiError(error)) {
      setErrors({
        form:
          error instanceof Error ? error.message : "Account creation failed",
      });
      return;
    }

    const message = error.payload.message ?? "Account creation failed";
    const fieldErrors = error.payload.issues?.fieldErrors;

    if (message === "Email already exists") {
      setErrors({
        email: "An account with this email already exists.",
        form: "Use a different email or sign in instead.",
      });
      return;
    }

    setErrors({
      firstName: fieldErrors?.firstName?.[0],
      lastName: fieldErrors?.lastName?.[0],
      email: fieldErrors?.email?.[0],
      password: fieldErrors?.password?.[0],
      confirmPassword: fieldErrors?.confirmPassword?.[0],
      form: error.payload.issues?.formErrors?.[0] ?? message,
    });
  };

  const registerMutation = useMutation({
    mutationFn: api.register,
    onMutate: () => {
      toast.loading("Creating your account...", { id: "signup-request" });
    },
    onSuccess: (session) => {
      toast.dismiss("signup-request");
      authStore.setAuth(session);
      setErrors({});
      toast.success(`Account created. Welcome, ${session.user.firstName}.`, {
        id: "signup-success",
      });
      void navigate({ to: "/" });
    },
    onError: (error) => {
      toast.dismiss("signup-request");
      applyServerError(error);
      toast.error(
        isApiError(error)
          ? (error.payload.message ?? "Account creation failed")
          : error instanceof Error
            ? error.message
            : "Account creation failed",
        { id: "signup-error" },
      );
    },
  });

  const isLoading = registerMutation.isPending;

  const validateForm = (values: FormData): FormErrors => {
    const nextErrors: FormErrors = {};
    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();
    const email = values.email.trim();

    if (!firstName) {
      nextErrors.firstName = "First name is required.";
    }

    if (!lastName) {
      nextErrors.lastName = "Last name is required.";
    }

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

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  };

  const validateField = (field: keyof FormData, values: FormData) =>
    validateForm(values)[field];

  const updateField = (field: keyof FormData, value: string) => {
    setForm((current) => {
      const nextForm = { ...current, [field]: value };

      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: touched[field] ? validateField(field, nextForm) : undefined,
        confirmPassword:
          field === "password" && touched.confirmPassword
            ? validateField("confirmPassword", nextForm)
            : currentErrors.confirmPassword,
        form: undefined,
      }));

      return nextForm;
    });
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({
      ...current,
      [field]: validateField(field, form),
      confirmPassword:
        field === "password" && touched.confirmPassword
          ? validateField("confirmPassword", form)
          : current.confirmPassword,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    if (
      nextErrors.firstName ||
      nextErrors.lastName ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      setErrors(nextErrors);
      return;
    }

    await registerMutation.mutateAsync({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
  };

  const field = (
    id: string,
    label: string,
    field: keyof FormData,
    type: string,
    placeholder: string,
    showToggle?: boolean,
    showState?: boolean,
    toggleShow?: () => void,
  ) => (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ color: "oklch(0.75 0 0)" }}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showToggle ? (showState ? "text" : "password") : type}
          autoComplete={
            type === "email"
              ? "email"
              : showToggle
                ? "new-password"
                : "given-name"
          }
          placeholder={placeholder}
          value={form[field]}
          onChange={(event) => updateField(field, event.target.value)}
          onBlur={() => handleBlur(field)}
          className="h-11"
          style={{
            background: "oklch(0.18 0 0)",
            border: errors[field]
              ? "1px solid oklch(0.65 0.27 22 / 0.8)"
              : "1px solid oklch(0.28 0 0)",
            color: "oklch(0.94 0 0)",
            paddingRight: showToggle ? "2.75rem" : undefined,
          }}
          data-ocid={`signup.${field}_input`}
        />
        {showToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "oklch(0.48 0 0)" }}
            onClick={toggleShow}
            aria-label={showState ? "Hide password" : "Show password"}
          >
            {showState ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {errors[field] && (
        <p
          className="text-xs"
          style={{ color: "oklch(0.70 0.22 22)" }}
          data-ocid={`signup.${field}.field_error`}
        >
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-8"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 75% 25%, oklch(0.68 0.2 92 / 0.14) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 25% 75%, oklch(0.72 0.21 262 / 0.14) 0%, transparent 55%), oklch(0.09 0 0)",
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
        className="pointer-events-none absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
        style={{ background: "oklch(0.68 0.2 92)" }}
      />
      <div
        className="pointer-events-none absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-8"
        style={{ background: "oklch(0.72 0.21 262)" }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4">
        {/* Logo */}
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
                background: "oklch(0.68 0.2 92 / 0.2)",
                border: "1px solid oklch(0.68 0.2 92 / 0.4)",
                boxShadow: "0 0 24px oklch(0.68 0.2 92 / 0.25)",
              }}
            >
              <TrendingUp
                className="w-6 h-6"
                style={{ color: "oklch(0.78 0.22 92)" }}
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
            Join thousands of disciplined traders
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
            border: "1px solid oklch(0.68 0.2 92 / 0.25)",
            boxShadow:
              "0 0 40px oklch(0.68 0.2 92 / 0.08), 0 24px 48px oklch(0 0 0 / 0.4)",
          }}
        >
          {/* Header */}
          <div className="mb-7 text-center">
            <h1
              className="font-display text-2xl font-bold mb-2"
              style={{ color: "oklch(0.96 0 0)" }}
            >
              Start for free
            </h1>
            <p className="text-sm" style={{ color: "oklch(0.62 0 0)" }}>
              Create your Edgerift Metrics account and turn your trades into
              insights.
            </p>
          </div>

          {/* Perks grid */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            {PERKS.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="flex gap-3 rounded-xl p-3"
                style={{
                  background: "oklch(0.17 0 0 / 0.8)",
                  border: "1px solid oklch(0.24 0 0)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.68 0.2 92 / 0.15)" }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: "oklch(0.75 0.2 92)" }}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="font-display font-semibold text-xs mb-0.5"
                    style={{ color: "oklch(0.88 0 0)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-xs leading-tight"
                    style={{ color: "oklch(0.50 0 0)" }}
                  >
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* What you get checklist */}
          <ul className="space-y-2 mb-7">
            {[
              "Fully decentralized — your data is yours",
              "No subscriptions, no credit card required",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm"
                style={{ color: "oklch(0.62 0 0)" }}
              >
                <CheckCircle2
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "oklch(0.75 0.2 92)" }}
                />
                {item}
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Form error */}
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
                data-ocid="signup.error_state"
              >
                {errors.form}
              </motion.div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              {field("signup-first", "First name", "firstName", "text", "Jane")}
              {field("signup-last", "Last name", "lastName", "text", "Smith")}
            </div>

            {field(
              "signup-email",
              "Email address",
              "email",
              "email",
              "you@example.com",
            )}
            {field(
              "signup-password",
              "Password",
              "password",
              "password",
              "Min. 8 characters",
              true,
              showPw,
              () => setShowPw((v) => !v),
            )}
            {field(
              "signup-confirm",
              "Confirm password",
              "confirmPassword",
              "password",
              "Re-enter password",
              true,
              showConfirm,
              () => setShowConfirm((v) => !v),
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-display font-semibold text-base mt-2 transition-smooth cursor-pointer"
              style={{
                background: isLoading
                  ? "oklch(0.58 0.17 92)"
                  : "oklch(0.68 0.2 92)",
                color: "oklch(0.09 0 0)",
                boxShadow: "0 0 20px oklch(0.68 0.2 92 / 0.30)",
              }}
              disabled={isLoading}
              data-ocid="signup.submit_button"
            >
              <UserPlus className="mr-2 w-5 h-5" />
              {isLoading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(0.22 0 0)" }}
            />
            <span
              className="font-mono text-xs"
              style={{ color: "oklch(0.42 0 0)" }}
            >
              already have an account?
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(0.22 0 0)" }}
            />
          </div>

          {/* Sign in link */}
          <button
            type="button"
            onClick={() => navigate({ to: "/signin" })}
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition-smooth border cursor-pointer"
            style={{
              background: "transparent",
              border: "1px solid oklch(0.30 0 0)",
              color: "oklch(0.72 0.21 262)",
            }}
            data-ocid="signup.signin_link"
          >
            Sign In instead
          </button>
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-center mt-6 text-xs"
          style={{ color: "oklch(0.38 0 0)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Powered by{" "}
          <span style={{ color: "oklch(0.62 0 0)" }}>Internet Identity</span> —
          no passwords, no email, fully sovereign.
        </motion.p>
      </div>
    </div>
  );
}
