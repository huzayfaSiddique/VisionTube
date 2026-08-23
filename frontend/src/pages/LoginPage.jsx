import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resendConfirmationEmail } from "../api/auth.api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

  const [resendStatus, setResendStatus] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const errorParam = searchParams.get("error");
  const verifiedParam = searchParams.get("verified");
  const registeredState = location.state?.registered;
  const registeredEmail = location.state?.email || "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: registeredEmail, password: "" } });

  const emailValue = watch("email");
  const targetEmail = emailValue || registeredEmail;

  const redirectTo = location.state?.from?.pathname || "/";

  // Handle 30-second countdown timer for resending email
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    setResendStatus("");
    setResendError("");

    if (!targetEmail || !targetEmail.trim()) {
      setResendError("Please enter your email address to resend confirmation.");
      return;
    }

    setIsResending(true);
    try {
      const res = await resendConfirmationEmail(targetEmail.trim());
      setResendStatus(
        res.message || "Confirmation email sent! Please check your inbox."
      );
      setResendCooldown(30); // Start 30-second timer
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to resend confirmation email.";
      setResendError(msg);

      // If server returned rate limit message with seconds, extract and set cooldown
      const match = msg.match(/wait (\d+) second/i);
      if (match && match[1]) {
        setResendCooldown(parseInt(match[1], 10));
      }
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await login(data);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Log in to VisionTube
        </h1>

        {registeredState && (
          <div className="mb-4 p-3.5 bg-emerald-950/70 border border-emerald-600/60 rounded-md text-emerald-200 text-sm space-y-2">
            <p>
              Account registered! Check your inbox for a confirmation email to verify your email address.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-emerald-800/60">
              <span className="text-xs text-emerald-300/80">Didn&apos;t get the email?</span>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                className="text-xs font-medium text-emerald-300 hover:text-white underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isResending
                  ? "Sending..."
                  : "Resend Email"}
              </button>
            </div>
          </div>
        )}

        {verifiedParam === "true" && (
          <div className="mb-4 p-3.5 bg-emerald-950/70 border border-emerald-600/60 rounded-md text-emerald-200 text-sm">
            🎉 Email verified successfully! Please log in to access VisionTube.
          </div>
        )}

        {errorParam && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-600/50 rounded-md text-red-300 text-sm">
            {errorParam === "invalid_token" || errorParam === "invalid_or_expired_token"
              ? "The email confirmation link is invalid or has expired."
              : "An error occurred with email confirmation."}
          </div>
        )}

        {resendStatus && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-600/50 rounded-md text-emerald-300 text-sm">
            {resendStatus}
          </div>
        )}

        {resendError && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-600/50 rounded-md text-red-300 text-sm">
            {resendError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1 text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-red-400 text-sm">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand hover:bg-brand-light transition-colors py-2 font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-neutral-400 mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-brand-light hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}


