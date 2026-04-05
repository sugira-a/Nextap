import { useState } from "react";
import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import { LayoutGrid, Users, CreditCard, Send, Settings, BarChart3, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

const CompanyLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const navItems = [
    { icon: LayoutGrid, label: "Overview", href: "/company" },
    { icon: Users, label: "Employees", href: "/company/employees" },
    { icon: CreditCard, label: "Cards", href: "/company/cards" },
    { icon: Send, label: "Invitations", href: "/company/invitations" },
    { icon: BarChart3, label: "Analytics", href: "/company/analytics" },
    { icon: Settings, label: "Settings", href: "/company/settings" },
  ];

  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar */}
      <motion.div
        initial={{ marginLeft: -256 }}
        animate={{ marginLeft: sidebarOpen ? 0 : -256 }}
        className="w-64 bg-card border-r border-border hidden md:flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">N</span>
            </div>
            <span className="font-heading font-bold text-lg">NexTap</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/company"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/10"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent/10 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">N</span>
            </div>
          </Link>
          <div className="w-5" />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyLayout;
