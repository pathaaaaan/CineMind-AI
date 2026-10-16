import { Film, Heart, LayoutDashboard, Search, Sparkles, TrendingUp } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../app/auth-provider";

const nav = [
  { to: "/top-rated", label: "Top 250", icon: TrendingUp },
  { to: "/search", label: "Discover", icon: Search },
  { to: "/watchlist", label: "Watchlist", icon: Heart },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
];

export function AppShell() {
  const { isAuthenticated, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Film size={19} />
            </span>
            CineMind AI
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                  }`
                }
              >
                <item.icon size={16} />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={signOut}
                className="ml-2 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : (
              <Link to="/login" className="ml-2 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
                <Sparkles size={16} />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
