import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

const DashboardLayout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isProfileStudio = location.pathname.startsWith("/dashboard/profile");

  return (
    <div className={isProfileStudio ? "flex h-screen w-full bg-[#f5f5f7] overflow-hidden" : "flex min-h-screen w-full bg-[#f5f5f7]"}>
      <DashboardSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 sticky top-0 z-40">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="font-bold text-sm text-zinc-900">NexTap</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-zinc-700" />
          </button>
        </header>

        <main className={isProfileStudio ? "flex-1 min-h-0 overflow-hidden p-0" : "flex-1 p-6 md:p-8 overflow-auto"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
