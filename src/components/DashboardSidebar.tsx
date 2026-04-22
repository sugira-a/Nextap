import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  UsersRound,
  X,
  Power,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";

const navItems = [
  { label: "Overview",     icon: LayoutDashboard, path: "/dashboard"            },
  { label: "Edit Profile", icon: User,             path: "/dashboard/profile"   },
  { label: "My Card",      icon: CreditCard,       path: "/dashboard/card"      },
  { label: "Analytics",   icon: BarChart3,        path: "/dashboard/analytics" },
  { label: "Contacts",    icon: UsersRound,       path: "/dashboard/contacts"  },
  { label: "Settings",    icon: Settings,         path: "/dashboard/settings"  },
];

type Props = {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarContent = ({
  collapsed,
  setCollapsed,
  unreadContacts,
  onNavClick,
  mobile = false,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  unreadContacts: number;
  onNavClick?: () => void;
  mobile?: boolean;
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "border-b border-zinc-200",
        collapsed && !mobile
          ? "flex flex-col items-center gap-2 py-3 px-2"
          : "flex items-center justify-between px-4 py-4"
      )}>
        {(!collapsed || mobile) && (
          <Link to="/" className="flex items-center gap-2.5" onClick={onNavClick}>
            <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-base text-zinc-900 tracking-tight">NexTap</span>
          </Link>
        )}
        {collapsed && !mobile && (
          <Link to="/" title="NexTap">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
          </Link>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 text-zinc-400 transition-transform duration-200", collapsed && "rotate-180")} />
          </button>
        )}
        {mobile && (
          <button onClick={onNavClick} className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors ml-auto">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              title={collapsed && !mobile ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                active
                  ? "bg-zinc-900 text-white font-medium"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-zinc-400")} />
              {(!collapsed || mobile) && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.path === "/dashboard/contacts" && unreadContacts > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-white text-zinc-900 text-[9px] font-bold flex items-center justify-center px-1">
                      {unreadContacts}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-zinc-200">
        <button
          onClick={() => { onNavClick?.(); handleLogout(); }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all group",
            collapsed && !mobile && "justify-center"
          )}
          title={collapsed && !mobile ? "Log out" : undefined}
        >
          <Power className="w-4 h-4 shrink-0 transition-colors" />
          {(!collapsed || mobile) && <span className="text-sm">Log out</span>}
        </button>
      </div>
    </div>
  );
};

const DashboardSidebar = ({ mobileOpen, setMobileOpen }: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadContacts, setUnreadContacts] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    apiRequest<{ unread_count: number }>("/api/profile/me/contacts?unread=true", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setUnreadContacts(res.unread_count)).catch(() => {});
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col sticky top-0 h-screen bg-white border-r border-zinc-200 transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}>
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          unreadContacts={unreadContacts}
        />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 md:hidden"
            >
              <SidebarContent
                collapsed={false}
                setCollapsed={() => {}}
                unreadContacts={unreadContacts}
                onNavClick={() => setMobileOpen(false)}
                mobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
