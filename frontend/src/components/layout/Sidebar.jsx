import { NavLink } from "react-router-dom";
import { Home, Users, ListVideo, ThumbsUp, History } from "lucide-react";

// NOTE: only "/" (Home) has a real page behind it right now (Step 4+).
// The other links are wired up so the shell is complete, but their
// routes don't exist yet — clicking them will show a blank content
// area until we build those pages in later steps. That's expected.
const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/subscriptions", label: "Subscriptions", icon: Users },
  { to: "/playlists", label: "Playlists", icon: ListVideo },
  { to: "/liked-videos", label: "Liked videos", icon: ThumbsUp },
  { to: "/history", label: "History", icon: History },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-56 border-r border-neutral-800 overflow-y-auto hidden md:block">
      <nav className="p-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
