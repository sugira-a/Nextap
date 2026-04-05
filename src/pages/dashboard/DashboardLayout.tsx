import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";

const DashboardLayout = () => (
  <div className="flex min-h-screen w-full bg-surface">
    <DashboardSidebar />
    <main className="flex-1 p-6 md:p-8 overflow-auto">
      <Outlet />
    </main>
  </div>
);

export default DashboardLayout;
