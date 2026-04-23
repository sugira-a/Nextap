import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

type AdminStats = {
  total_companies: number;
  active_companies: number;
  total_users: number;
  total_cards: number;
  claimed_cards: number;
  active_cards: number;
  by_role: { admin: number; company_admin: number; employee: number };
};

type AdminAuditLog = {
  id: string;
  action: string;
  target_type: string;
  timestamp?: string;
  actor?: { id: string; email: string; first_name: string; last_name: string };
};

type AdminCard = {
  code: string;
  status: string;
  assigned_user_id?: string | null;
};

const AdminOverview = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [topCards, setTopCards] = useState<AdminCard[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, logsRes, cardsRes] = await Promise.all([
          apiRequest<{ stats: AdminStats }>("/api/admin/stats", { headers: authHeaders }),
          apiRequest<{ audit_logs: AdminAuditLog[] }>("/api/admin/audit-logs?per_page=5", { headers: authHeaders }),
          apiRequest<{ cards: AdminCard[] }>("/api/admin/cards?per_page=5", { headers: authHeaders }),
        ]);
        setStats(statsRes.stats);
        setLogs(logsRes.audit_logs || []);
        setTopCards(cardsRes.cards || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load admin overview");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authHeaders]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  const metricCards = [
    { label: "Users", value: stats.total_users, sub: `${stats.by_role.admin} admins` },
    { label: "Cards", value: stats.total_cards, sub: `${stats.active_cards} active` },
    { label: "Companies", value: stats.total_companies, sub: `${stats.active_companies} active` },
    { label: "Claimed", value: stats.claimed_cards, sub: "Cards claimed" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-8 py-2"
    >
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Admin</p>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Overview</h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 rounded-2xl overflow-hidden border border-zinc-200">
        {metricCards.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white px-6 py-7 hover:bg-zinc-50 transition-colors"
          >
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">{m.label}</p>
            <p className="text-4xl font-bold text-zinc-900 tracking-tight mt-1">{m.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Roles + Activity */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Roles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sm:col-span-1 lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-5">System Roles</p>
          <div className="space-y-3">
            {Object.entries(stats.by_role).map(([role, count]) => {
              const total = stats.total_users || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-zinc-700 capitalize font-medium">{role.replace("_", " ")}</span>
                    <span className="text-zinc-400 tabular-nums">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.35 }}
                      className="h-full bg-zinc-900 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="sm:col-span-1 lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-4">Recent Activity</p>
          {logs.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {logs.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-900 font-medium truncate">
                      <span className="font-semibold">{item.action}</span>{" "}
                      <span className="text-zinc-400">{item.target_type}</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.actor?.email || "System"}</p>
                  </div>
                  <span className="text-xs text-zinc-300 ml-4 whitespace-nowrap tabular-nums">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-zinc-400">No audit logs yet</div>
          )}
        </motion.div>
      </div>

      {/* Top Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-zinc-200 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-900">Recent Cards</p>
          <Link to="/admin/cards" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {topCards.length > 0 ? topCards.map((card) => (
            <Link
              key={card.code}
              to={`/admin/cards/${card.code}`}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50 transition-colors group"
            >
              <span className="font-mono text-sm font-medium text-zinc-900">{card.code}</span>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  card.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                }`}>{card.status}</span>
                <span className="text-xs text-zinc-300 group-hover:text-zinc-500 transition-colors">
                  {card.assigned_user_id ? "Assigned" : "Unassigned"}
                </span>
              </div>
            </Link>
          )) : (
            <div className="px-6 py-8 text-sm text-zinc-400 text-center">No cards yet</div>
          )}
        </div>
      </motion.div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Manage Users", path: "/admin/users" },
          { label: "All Cards", path: "/admin/cards" },
          { label: "Companies", path: "/admin/companies" },
          { label: "Analytics", path: "/admin/analytics" },
        ].map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-4 flex items-center justify-between hover:bg-zinc-50 hover:border-zinc-400 transition-colors group"
          >
            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{link.label}</span>
            <span className="text-zinc-300 group-hover:text-zinc-600 transition-colors">→</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default AdminOverview;