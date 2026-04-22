import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest, apiRequestWithFallback } from "@/lib/api";

type OverviewResponse = {
  overview: {
    period_days: number;
    totals: { companies: number; users: number; cards: number; events: number };
    new_in_period: { companies: number; users: number; cards: number };
    status_breakdown: { active: number; inactive: number; suspended: number };
    events_by_day: Record<string, number>;
    top_companies: Array<{ company_id: string; name: string; events: number; users: number; cards: number }>;
    top_users: Array<{ user_id: string; name: string; email: string; role: string; events: number; company?: string | null }>;
    company_options: Array<{ id: string; name: string; slug: string; status: string }>;
  };
};

const AdminAnalytics = () => {
  const [days, setDays] = useState(30);
  const [companyId, setCompanyId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewResponse["overview"] | null>(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ days: String(days) });
      if (companyId !== "all") params.set("company_id", companyId);

      const overviewData = await apiRequestWithFallback<OverviewResponse["overview"]>([
        async () => {
          const r = await apiRequest<OverviewResponse>(`/api/admin/analytics/overview?${params}`, { headers: authHeaders });
          return r.overview;
        },
        async () => {
          const [statsRes, companiesRes] = await Promise.all([
            apiRequest<{ stats: { total_companies: number; total_users: number; total_cards: number; by_role: { admin: number; company_admin: number; employee: number } } }>("/api/admin/stats", { headers: authHeaders }),
            apiRequest<{ companies: Array<{ id: string; name: string; slug: string; status: string }> }>("/api/admin/companies?per_page=200", { headers: authHeaders }).catch(() => ({ companies: [] })),
          ]);
          const eventsByDay: Record<string, number> = {};
          for (let i = 0; i < days; i++) {
            const d = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
            eventsByDay[d] = 0;
          }
          return {
            period_days: days,
            totals: { companies: statsRes.stats.total_companies, users: statsRes.stats.total_users, cards: statsRes.stats.total_cards, events: 0 },
            new_in_period: { companies: 0, users: 0, cards: 0 },
            status_breakdown: { active: 0, inactive: 0, suspended: 0 },
            events_by_day: eventsByDay,
            top_companies: [],
            top_users: [],
            company_options: companiesRes.companies || [],
          };
        },
      ]);
      setOverview(overviewData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOverview(); }, [days, companyId]);

  const downloadSnapshotCsv = () => {
    if (!overview) { toast.error("No data"); return; }
    const rows: Array<Record<string, string | number>> = [
      { section: "Summary", metric: "Period Days", value: overview.period_days },
      { section: "Summary", metric: "Total Companies", value: overview.totals.companies },
      { section: "Summary", metric: "Total Users", value: overview.totals.users },
      { section: "Summary", metric: "Total Cards", value: overview.totals.cards },
      { section: "Summary", metric: "Total Events", value: overview.totals.events },
      ...Object.entries(overview.events_by_day).map(([date, v]) => ({ section: "Events By Day", metric: date, value: v })),
      ...overview.top_companies.map((c, i) => ({ section: "Top Companies", metric: `${i + 1}. ${c.name}`, value: c.events })),
    ];
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `analytics-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-sm text-zinc-400">Failed to load analytics</p>
        <button onClick={loadOverview} className="text-sm border border-zinc-200 rounded-xl px-4 py-2 text-zinc-500 hover:bg-zinc-50 transition-colors">Retry</button>
      </div>
    );
  }

  const eventsByDay = Object.entries(overview.events_by_day).slice(-7).map(([date, v]) => ({
    date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    events: v,
  }));
  const maxBar = Math.max(...eventsByDay.map(d => d.events), 1);

  const statItems = [
    { label: "Companies", value: overview.totals.companies, delta: `+${overview.new_in_period.companies} new` },
    { label: "Users", value: overview.totals.users, delta: `+${overview.new_in_period.users} new` },
    { label: "Cards", value: overview.totals.cards, delta: `+${overview.new_in_period.cards} new` },
    { label: "Events", value: overview.totals.events, delta: `${overview.period_days}d window` },
  ];

  const maxCompanyEvents = Math.max(...overview.top_companies.map(c => c.events), 1);

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
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Admin</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${days === d ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>{d}d</button>
            ))}
          </div>
          {overview.company_options.length > 0 && (
            <select
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="text-xs border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-700 outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="all">All Companies</option>
              {overview.company_options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button onClick={downloadSnapshotCsv} className="text-xs border border-zinc-200 rounded-xl px-4 py-2 text-zinc-500 hover:bg-zinc-50 transition-colors">Export CSV</button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 rounded-2xl overflow-hidden border border-zinc-200">
        {statItems.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }} className="bg-white px-6 py-7 hover:bg-zinc-50 transition-colors">
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">{s.label}</p>
            <p className="text-4xl font-bold text-zinc-900 tracking-tight mt-1">{s.value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{s.delta}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly chart + Status */}
      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-6">Events "” Last 7 Days</p>
          {eventsByDay.length > 0 ? (
            <>
              <div className="flex items-end gap-2 h-36">
                {eventsByDay.map((d, idx) => (
                  <motion.div key={d.date} initial={{ height: 0 }} animate={{ height: `${Math.max((d.events / maxBar) * 100, 5)}%` }} transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 + idx * 0.05 }} title={`${d.events} events`} className="flex-1 rounded-t-md bg-zinc-900 hover:bg-zinc-700 transition-colors cursor-default" />
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                {eventsByDay.map(d => <span key={d.date} className="flex-1 text-center text-[11px] text-zinc-400">{d.date}</span>)}
              </div>
            </>
          ) : <div className="h-36 flex items-center justify-center text-sm text-zinc-400">No data</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-5">Status Breakdown</p>
          <div className="space-y-3">
            {Object.entries(overview.status_breakdown).map(([label, count]) => {
              const total = Object.values(overview.status_breakdown).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-zinc-700 capitalize font-medium">{label}</span>
                    <span className="text-zinc-400 tabular-nums">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.4 }} className="h-full bg-zinc-900 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Top Companies */}
      {overview.top_companies.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-5">Top Companies by Events</p>
          <div className="space-y-3">
            {overview.top_companies.slice(0, 5).map(c => {
              const pct = Math.round((c.events / maxCompanyEvents) * 100);
              return (
                <div key={c.company_id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-zinc-700 font-medium">{c.name}</span>
                    <span className="text-zinc-400 tabular-nums">{c.events} events</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.45 }} className="h-full bg-zinc-900 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Top Users */}
      {overview.top_users.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Top Users by Activity</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {overview.top_users.slice(0, 5).map(user => (
              <div key={user.user_id} className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 capitalize">{user.role?.replace("_", " ")}</span>
                  <span className="text-xs font-semibold text-zinc-700 tabular-nums">{user.events} events</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminAnalytics;