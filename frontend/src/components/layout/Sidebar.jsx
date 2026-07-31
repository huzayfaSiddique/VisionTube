import { NavLink } from "react-router-dom";
import { Home, Users, ListVideo, ThumbsUp, History, Video } from "lucide-react";

// NOTE: "/", "/watch/:id", "/c/:username", "/subscriptions", "/upload",
// "/studio", "/playlists", "/liked-videos", and "/history" are all real
// pages now.
const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/subscriptions", label: "Subscriptions", icon: Users },
  { to: "/studio", label: "Your videos", icon: Video },
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
