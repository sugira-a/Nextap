import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

const CompanyAnalytics = () => {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<any>(`/api/analytics/company/${companyId}?days=${days}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      setAnalytics(data.analytics);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  const eventsByDay = analytics
    ? Object.entries(analytics.events_by_day).slice(-7).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        events: count as number,
      }))
    : [];

  const topCards = analytics?.top_cards?.slice(0, 5) ?? [];
  const maxCardViews = Math.max(...topCards.map((c: any) => c.views || c.events || 0), 1);

  const deviceBreakdown = Object.entries(analytics?.device_breakdown || {});
  const maxDevice = Math.max(...deviceBreakdown.map(([, v]) => v as number), 1);

  const maxBar = Math.max(...eventsByDay.map(d => d.events), 1);

  const statItems = [
    { label: "Total Events", value: analytics?.total_events ?? 0 },
    { label: "Card Taps", value: analytics?.taps ?? 0 },
    { label: "Profile Views", value: analytics?.profile_views ?? 0 },
    { label: "Unique Devices", value: analytics?.unique_devices?.length ?? 0 },
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
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Company</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Analytics</h1>
        </div>
        <div className="flex gap-1.5">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                days === d ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 rounded-2xl overflow-hidden border border-zinc-200">
        {statItems.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white px-6 py-7 hover:bg-zinc-50 transition-colors"
          >
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">{s.label}</p>
            <p className="text-4xl font-bold text-zinc-900 tracking-tight mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly chart + Devices */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Weekly chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-6">Events "" Last 7 Days</p>
          {eventsByDay.length > 0 ? (
            <>
              <div className="flex items-end gap-2 h-36">
                {eventsByDay.map((d, idx) => {
                  const pct = Math.max((d.events / maxBar) * 100, 5);
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
                {eventsByDay.map(d => (
                  <span key={d.date} className="flex-1 text-center text-[11px] text-zinc-400">{d.date}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-36 flex items-center justify-center text-sm text-zinc-400">No data</div>
          )}
        </motion.div>

        {/* Devices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-5">Device Types</p>
          <div className="space-y-3">
            {deviceBreakdown.length > 0 ? deviceBreakdown.map(([device, count]) => {
              const pct = Math.round(((count as number) / maxDevice) * 100);
              return (
                <div key={device}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-zinc-700 capitalize font-medium">{device}</span>
                    <span className="text-zinc-400 tabular-nums">{count as number}</span>
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
            }) : (
              <p className="text-sm text-zinc-400">No device data</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top cards */}
      {topCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-zinc-200 rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-5">Top Cards</p>
          <div className="space-y-3">
            {topCards.map((card: any) => {
              const val = card.views || card.events || 0;
              const pct = Math.round((val / maxCardViews) * 100);
              return (
                <div key={card.code || card.card_id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-zinc-700 font-mono font-medium">{card.code || card.card_id}</span>
                    <span className="text-zinc-400 tabular-nums">{val} views</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.45 }}
                      className="h-full bg-zinc-900 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CompanyAnalytics;