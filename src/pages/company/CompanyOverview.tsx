import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

type CompanyMeta = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  subscription_seats: number;
};

const CompanyOverview = () => {
  const [stats, setStats] = useState({ total_employees: 0, active_employees: 0, total_cards: 0, active_cards: 0, claimed_cards: 0 });
  const [analyticsData, setAnalyticsData] = useState<{ date: string; events: number }[]>([]);
  const [company, setCompany] = useState<CompanyMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const companyId = await getCurrentCompanyId();
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [statsRes, companyRes, analyticsRes] = await Promise.all([
          apiRequest<{ stats: typeof stats }>(`/api/company/${companyId}/stats`, { headers }),
          apiRequest<{ company: CompanyMeta }>(`/api/company/${companyId}`, { headers }),
          apiRequest<{ analytics: { events_by_day: Record<string, number> } }>(`/api/analytics/company/${companyId}?days=30`, { headers }),
        ]);
        setStats(statsRes.stats);
        setCompany(companyRes.company);
        setAnalyticsData(
          Object.entries(analyticsRes.analytics.events_by_day).slice(-7).map(([date, count]) => ({
            date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
            events: count,
          }))
        );
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  const maxEvents = Math.max(...analyticsData.map(d => d.events), 1);

  const metricCards = [
    { label: "Employees", value: stats.total_employees, sub: `${stats.active_employees} active` },
    { label: "Cards", value: stats.total_cards, sub: `${stats.active_cards} active` },
    { label: "Claimed", value: stats.claimed_cards, sub: "Cards claimed" },
    { label: "Seats", value: company?.subscription_seats ?? 0, sub: company?.plan || "plan" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-8 py-2"
    >
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Workspace</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{company?.name || "Company"}</h1>
          <p className="text-sm text-zinc-400 mt-1">/{company?.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${
            company?.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"
          }`}>{company?.status || "active"}</span>
          <span className="text-xs font-medium px-3 py-1 rounded-full border border-zinc-200 text-zinc-500 capitalize">
            {company?.plan || "starter"}
          </span>
        </div>
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

      {/* Activity chart + Card distribution */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-zinc-900">Activity (Last 7 Days)</p>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          {analyticsData.length > 0 ? (
            <>
              <div className="flex items-end gap-2 h-36">
                {analyticsData.map((d, idx) => {
                  const pct = Math.max((d.events / maxEvents) * 100, 6);
                  return (
                    <motion.div
                      key={d.date}
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 + idx * 0.05 }}
                      title={`${d.events} events`}
                      className="flex-1 rounded-t-md bg-zinc-900 hover:bg-zinc-700 transition-colors cursor-default"
                    />
                  );
                })}
              </div>
              <div className="flex gap-2 mt-3">
                {analyticsData.map((d) => (
                  <span key={d.date} className="flex-1 text-center text-[11px] text-zinc-400">{d.date}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-36 flex items-center justify-center text-sm text-zinc-400">No activity yet</div>
          )}
        </motion.div>

        {/* Card distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-5">Card Distribution</p>
          <div className="space-y-4">
            {[
              { label: "Active", value: stats.active_cards },
              { label: "Claimed", value: stats.claimed_cards },
              { label: "Unclaimed", value: stats.total_cards - stats.claimed_cards },
            ].map(({ label, value }) => {
              const pct = stats.total_cards > 0 ? Math.round((value / stats.total_cards) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-zinc-700 font-medium">{label}</span>
                    <span className="text-zinc-400 tabular-nums">{value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.4 }}
                      className="h-full bg-zinc-900 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Invite Employee", path: "/company/invitations" },
          { label: "Manage Cards", path: "/company/cards" },
          { label: "Company Settings", path: "/company/settings" },
        ].map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-4 flex items-center justify-between hover:bg-zinc-50 hover:border-zinc-400 transition-colors group"
          >
            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{link.label}</span>
            <span className="text-zinc-300 group-hover:text-zinc-600 transition-colors">-></span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default CompanyOverview;