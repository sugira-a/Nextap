import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { apiRequest, clearAuthTokens } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRightFromLine, CircleArrowOutUpRight, LayoutGrid, Gauge, Building2, CreditCard, UsersRound, UserCircle2, LogOut, Link2 } from "lucide-react";

const navItems = [
  { label: "Overview",    path: "/admin",             icon: LayoutGrid },
  { label: "Analytics",  path: "/admin/analytics",    icon: Gauge },
  { label: "Companies",  path: "/admin/companies",    icon: Building2 },
  { label: "Cards",      path: "/admin/cards",        icon: CreditCard },
  { label: "Users",      path: "/admin/users",        icon: UsersRound },
  { label: "Customers",  path: "/admin/customers",    icon: UserCircle2 },
  { label: "Short Links",path: "/admin/short-links",  icon: Link2 },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const validateAdminSession = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const response = await apiRequest<{ user: { role: string } }>("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.user?.role !== "admin") {
          toast.error("Admin access required");
          navigate("/dashboard", { replace: true });
        }
      } catch {
        clearAuthTokens();
        navigate("/login", { replace: true });
      }
    };
    validateAdminSession();
  }, [navigate]);

  const handleExitAdmin = () => {
    clearAuthTokens();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-50">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex sticky top-0 h-screen border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 flex-col transition-all duration-300 shadow-lg",
        collapsed ? "w-16" : "w-56"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-700 shrink-0">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">N</span>
              </div>
              <span className="font-bold text-sm text-white">Admin</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn("p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors", collapsed && "mx-auto")}
          >
            <svg className={cn("w-4 h-4 transition-transform text-white/60", collapsed && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm transition-colors",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                  active
                    ? "bg-white/20 text-white font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("shrink-0 w-5 h-5", active ? "text-white" : "text-white/70")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-700 shrink-0">
          <button
            onClick={handleExitAdmin}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors", collapsed && "justify-center px-2")}
            title={collapsed ? "Exit Admin" : undefined}
          >
            <CircleArrowOutUpRight className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Exit Admin</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-zinc-200 bg-white shrink-0">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
              <span className="text-white text-[10px] font-black">N</span>
            </div>
            <span className="font-bold text-sm text-zinc-900">Admin</span>
          </Link>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-zinc-100">
            <Menu className="w-5 h-5 text-zinc-700" />
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/30 md:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 md:hidden flex flex-col"
              >
                <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-100 shrink-0">
                  <span className="font-bold text-sm text-zinc-900">Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-zinc-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                  {navItems.map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          active
                            ? "bg-[#1e3a5f] text-white font-medium"
                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        )}
                      >
                        <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full", active ? "bg-[#1e3a5f]" : "bg-zinc-300")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-2 border-t border-zinc-100 shrink-0">
                  <button
                    onClick={handleExitAdmin}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <CircleArrowOutUpRight className="w-4 h-4 shrink-0" />
                    <span>Exit Admin</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8 min-h-0 bg-zinc-50\">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;