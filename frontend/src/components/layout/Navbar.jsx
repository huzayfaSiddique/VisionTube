import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Search, Upload, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");
  const menuRef = useRef(null);

  // Keep the input in sync with the URL when landing on /search directly
  // or navigating between different searches.
  useEffect(() => {
    if (location.pathname === "/search") {
      setSearchValue(searchParams.get("q") || "");
    }
  }, [location.pathname, searchParams]);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-neutral-800 flex items-center justify-between px-4 gap-4 z-20">
      <Link to="/" className="text-lg font-semibold shrink-0">
        VisionTube
      </Link>

      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-xl hidden sm:flex"
      >
        <div className="flex w-full rounded-md overflow-hidden border border-neutral-700">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search"
            className="w-full bg-neutral-900 px-3 py-1.5 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 bg-neutral-800 hover:bg-neutral-700 transition-colors"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/upload"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm border border-neutral-700 hover:bg-neutral-900 transition-colors"
        >
          <Upload size={16} />
          <span className="hidden sm:inline">Upload</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-1 rounded-full hover:bg-neutral-900 p-1 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-medium">
                {user?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <ChevronDown size={16} className="text-neutral-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-neutral-800 bg-neutral-900 shadow-lg py-1">
              <div className="px-3 py-2 border-b border-neutral-800">
                <p className="text-sm font-medium truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  @{user?.username}
                </p>
              </div>

              <Link
                to={`/c/${user?.username}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                <User size={16} />
                Your channel
              </Link>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                <Settings size={16} />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-neutral-800"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
