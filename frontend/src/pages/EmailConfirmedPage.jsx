import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function EmailConfirmedPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Broadcast to Tab #1 (the original signup / verification waiting tab)
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("visiontube_email_verification");
      channel.postMessage({ type: "EMAIL_VERIFIED" });
      channel.close();
    }

    // 2. Storage fallback for cross-tab notification
    localStorage.setItem("visiontube_email_verified", "true");

    // 3. Automatically redirect Tab #2 to login after 3 seconds
    const timeout = setTimeout(() => {
      navigate("/login?verified=true", { replace: true });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-neutral-900/80 border border-neutral-800 rounded-xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-bold">
          ✓
        </div>

        <h1 className="text-2xl font-semibold mb-2">Email Confirmed!</h1>
        <p className="text-neutral-300 text-sm mb-6">
          Your email address has been successfully verified. Your sign-up tab has been automatically updated.
        </p>

        <div className="space-y-4">
          <Link
            to="/login?verified=true"
            className="block w-full rounded-md bg-brand hover:bg-brand-light text-white py-2.5 text-sm font-medium transition-colors"
          >
            Go to Login Now
          </Link>
        </div>
      </div>
    </div>
  );
}
