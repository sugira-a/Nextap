import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { apiRequest, clearAuthTokens } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
  { label: "Overview", path: "/admin" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "Companies", path: "/admin/companies" },
  { label: "Cards", path: "/admin/cards" },
  { label: "Users", path: "/admin/users" },
  { label: "Customers", path: "/admin/customers" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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
      <aside className={cn(
        "sticky top-0 h-screen border-r border-zinc-200 bg-white flex flex-col transition-all duration-300",
        collapsed ? "w-14" : "w-56"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-100 shrink-0">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">N</span>
              </div>
              <span className="font-bold text-sm text-zinc-900">Admin</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn("p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors", collapsed && "mx-auto")}
          >
            <svg className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-zinc-900 text-white font-medium"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full", active ? "bg-white" : "bg-zinc-300")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-zinc-100 shrink-0">
          <button
            onClick={handleExitAdmin}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title={collapsed ? "Exit Admin" : undefined}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 15l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {!collapsed && <span>Exit Admin</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;