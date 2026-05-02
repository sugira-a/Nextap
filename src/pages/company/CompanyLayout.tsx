import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const navItems = [
  { label: "Overview", href: "/company" },
  { label: "Employees", href: "/company/employees" },
  { label: "Employee Studio", href: "/company/employee-studio" },
  { label: "Cards", href: "/company/cards" },
  { label: "Profile Studio", href: "/company/profile" },
  { label: "Invitations", href: "/company/invitations" },
  { label: "Analytics", href: "/company/analytics" },
  { label: "Settings", href: "/company/settings" },
];

const CompanyLayout = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
    toast.success("Logged out successfully");
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
            <Link to="/company" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">N</span>
              </div>
              <span className="font-bold text-sm text-zinc-900">Company</span>
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
          {navItems.map(item => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/company"}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-zinc-900 text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-zinc-100 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title={collapsed ? "Logout" : undefined}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 15l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default CompanyLayout;