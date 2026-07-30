import { useAuth } from "../context/AuthContext";

// Placeholder — the real video feed is built in Step 4.
// This just proves the layout + auth flow work end-to-end.
export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">
        Welcome, {user?.fullName ?? user?.username}
      </h1>
      <p className="text-neutral-400 text-sm">
        Home feed comes in Step 4 — this page just confirms the layout shell
        and auth both work together.
      </p>
    </div>
  );
}
