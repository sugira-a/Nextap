import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CreditCard, Users, Building2, ChevronLeft, LogOut, UserRoundPen, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest, clearAuthTokens } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Companies", icon: Building2, path: "/admin/companies" },
  { label: "Cards", icon: CreditCard, path: "/admin/cards" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Customers", icon: UserRoundPen, path: "/admin/customers" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const validateAdminSession = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await apiRequest<{ user: { role: string } }>("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    <div className="flex min-h-screen w-full bg-surface">
      <aside className={cn("sticky top-0 h-screen border-r border-border bg-sidebar flex flex-col transition-all duration-300", collapsed ? "w-16" : "w-64")}>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <span className="font-heading font-bold text-lg text-sidebar-foreground">Admin</span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className={cn("p-1.5 rounded-md hover:bg-sidebar-accent", collapsed && "mx-auto")}>
            <ChevronLeft className={cn("w-4 h-4 text-sidebar-foreground transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50")}>
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={handleExitAdmin} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50">
            <LogOut className="w-4 h-4 shrink-0" />
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
