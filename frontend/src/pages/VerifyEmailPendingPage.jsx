import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resendConfirmationEmail } from "../api/auth.api";

export default function VerifyEmailPendingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [resendStatus, setResendStatus] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // 1. Cross-tab synchronization: Listen for verification signal from Tab #2
  useEffect(() => {
    // Channel for modern browsers
    let channel;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("visiontube_email_verification");
      channel.onmessage = (event) => {
        if (event.data?.type === "EMAIL_VERIFIED") {
          navigate("/login?verified=true", { replace: true });
        }
      };
    }

    // Fallback: localStorage event listener
    const handleStorageChange = (e) => {
      if (e.key === "visiontube_email_verified" && e.newValue === "true") {
        localStorage.removeItem("visiontube_email_verified");
        navigate("/login?verified=true", { replace: true });
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  // 2. Cooldown 30-second timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 3. Resend Email Handler
  const handleResendEmail = async () => {
    setResendStatus("");
    setResendError("");

    if (!email) {
      setResendError("No email address provided. Please return to sign up.");
      return;
    }

    setIsResending(true);
    try {
      const res = await resendConfirmationEmail(email);
      setResendStatus(
        res.message || "Confirmation email sent! Please check your inbox."
      );
      setResendCooldown(30); // 30s rate limit
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to resend confirmation email.";
      setResendError(msg);

      const match = msg.match(/wait (\d+) second/i);
      if (match && match[1]) {
        setResendCooldown(parseInt(match[1], 10));
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-neutral-900/80 border border-neutral-800 rounded-xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
          ✉️
        </div>

        <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
        <p className="text-neutral-300 text-sm mb-4">
          We&apos;ve sent a confirmation link to:
        </p>
        <div className="bg-neutral-950 border border-neutral-800 rounded-md py-2 px-4 font-mono text-brand-light text-sm mb-6 inline-block max-w-full truncate">
          {email || "your email address"}
        </div>

        <p className="text-neutral-400 text-xs leading-relaxed mb-6">
          Click on the confirmation button in that email to verify your account.
          Once verified, this page will automatically refresh and take you to login.
        </p>

        {resendStatus && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-600/50 rounded-md text-emerald-300 text-xs">
            {resendStatus}
          </div>
        )}

        {resendError && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-600/50 rounded-md text-red-300 text-xs">
            {resendError}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
            className="w-full rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Resend email in ${resendCooldown}s`
              : isResending
              ? "Sending email..."
              : "Didn't get the email? Resend"}
          </button>

          <Link
            to="/login"
            className="block text-xs text-neutral-400 hover:text-brand-light transition-colors pt-2"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
