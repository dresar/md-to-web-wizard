import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Share2,
  MessageSquare,
  Settings as SettingsIcon,
  Menu,
  Sun,
  Moon,
  ChevronRight,
  ExternalLink,
  X,
  LogOut,
  User,
  Image as MediaIcon,
} from "lucide-react";
import { useBioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ParticlesBg } from "@/components/particles-bg";
import { getSessionFn, logoutAction } from "@/lib/api/auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (!session) {
      throw redirect({ to: "/login-admin" });
    }
    return { session };
  },
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/services", label: "Services", icon: Sparkles },
  { to: "/admin/social", label: "Social Media", icon: Share2 },
  { to: "/admin/templates", label: "WhatsApp Templates", icon: MessageSquare },
  { to: "/admin/media", label: "Media Manager", icon: MediaIcon },
  { to: "/admin/profile", label: "Profile", icon: User },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const theme = useBioStore((s) => s.settings.theme);
  const setTheme = useBioStore((s) => s.setTheme);
  const { session } = Route.useRouteContext();

  const current = nav.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)));

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login-admin";
  };

  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(session?.username ?? "A")}&backgroundType=gradientLinear&backgroundColor=2563eb,60a5fa`;

  return (
    <div className="bg-app min-h-screen relative">
      <ParticlesBg />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-40 inset-y-0 left-0 w-64 glass-strong border-r border-white/10 p-4 flex flex-col transition-transform",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-9 w-9 rounded-xl border border-white/10 object-cover shrink-0" />
            <div>
              <p className="text-sm font-display font-semibold leading-tight">Bio Link</p>
              <p className="text-[10px] text-muted-foreground">Admin Panel</p>
            </div>
          </Link>
          <button
            className="lg:hidden h-8 w-8 rounded-md grid place-items-center hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition",
                  active
                    ? "accent-gradient text-white accent-glow"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
                {active && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/"
          className="glass rounded-xl p-3 text-xs inline-flex items-center gap-2 hover:bg-white/10 transition"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Lihat halaman publik
        </Link>
      </aside>

      {/* Backdrop */}
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
        />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 glass-strong border-b border-white/10 h-16 flex items-center px-4 gap-3">
          <button
            className="lg:hidden h-9 w-9 rounded-md grid place-items-center hover:bg-white/10"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-semibold">{current?.label || "Admin"}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Kelola konten bio link kamu
            </p>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-full grid place-items-center hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenu((v) => !v)}
              className="h-9 rounded-full pl-1 pr-3 inline-flex items-center gap-2 hover:bg-white/10"
            >
              <img
                src={avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full border border-white/20"
              />
              <span className="text-sm font-medium hidden sm:inline">
                {session?.username ?? "Admin"}
              </span>
            </button>
            {userMenu && (
              <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl p-1 border border-white/10 animate-in fade-in slide-in-from-top-2">
                <Link
                  to="/admin/profile"
                  onClick={() => setUserMenu(false)}
                  className="flex items-center gap-2 px-3 h-9 rounded-lg text-sm hover:bg-white/10"
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setUserMenu(false)}
                  className="flex items-center gap-2 px-3 h-9 rounded-lg text-sm hover:bg-white/10"
                >
                  <SettingsIcon className="h-4 w-4" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-sm hover:bg-white/10 text-rose-300"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-6xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
