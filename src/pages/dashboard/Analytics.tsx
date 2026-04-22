import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Zap, BarChart3, TrendingUp, ArrowUpRight } from "lucide-react";
import { apiRequest, getUserIdFromToken } from "@/lib/api";

const BAR_COLOR = "#1e3a5f";

const TRACK_COLORS = [
  { bar: "from-slate-600 to-slate-400",  dot: "bg-slate-600" },
  { bar: "from-zinc-500 to-zinc-400",    dot: "bg-zinc-500" },
  { bar: "from-slate-400 to-slate-300",  dot: "bg-slate-400" },
];

const Analytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const userId = getUserIdFromToken();
        if (userId) {
          const data = await apiRequest<{ analytics: any }>(`/api/analytics/user/${userId}?days=30`, { headers });
          setAnalytics(data.analytics);
        } else {
          const me = await apiRequest<{ user: { id: string } }>("/api/auth/me", { headers });
          const data = await apiRequest<{ analytics: any }>(`/api/analytics/user/${me.user.id}?days=30`, { headers });
          setAnalytics(data.analytics);
        }
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-200 border-t-zinc-700 animate-spin" />
      </div>
    );
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const viewsByDay = analytics?.views_by_day || {};
  const dailyData: [string, number][] = last7.map((day) => [day, Number(viewsByDay[day] || 0)]);
  const maxDaily = Math.max(...dailyData.map(([, v]) => v), 1);
  const devices = Object.entries(analytics?.device_breakdown || {});
  const referrers: { url: string; count: number }[] = [];
  (analytics?.recent_events || []).forEach((e: any) => {
    if (!e.referrer) return;
    const existing = referrers.find((r) => r.url === e.referrer);
    if (existing) existing.count++;
    else referrers.push({ url: e.referrer, count: 1 });
  });

  const stats = [
    {
      label: "Profile Views",
      value: (analytics?.profile_views || 0).toLocaleString(),
      sub: "All time",
      Icon: Eye,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
    },
    {
      label: "Card Taps",
      value: (analytics?.taps || 0).toLocaleString(),
      sub: "NFC interactions",
      Icon: Zap,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
    },
    {
      label: "Total Events",
      value: (analytics?.total_events || 0).toLocaleString(),
      sub: "Last 30 days",
      Icon: BarChart3,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
    },
  ];

  const TrackBar = ({ pct, colorIdx, delay }: { pct: number; colorIdx: number; delay: number }) => (
    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 60, damping: 25, delay }}
        className={`h-full bg-gradient-to-r ${TRACK_COLORS[colorIdx % TRACK_COLORS.length].bar} rounded-full`}
      />
    </div>
  );

  const devicesOrFallback = devices.length > 0
    ? devices
    : [["Unknown", analytics?.total_events || 0]] as [string, number][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-6 py-2 px-0.5"
    >
      {/* Header */}
      <div className="pb-5 border-b border-zinc-100 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">Analytics</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Performance</h1>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-zinc-200 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, sub, Icon, iconBg, iconColor }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-200 group-hover:text-zinc-400 transition-colors" />
            </div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">{label}</p>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight mt-1.5 tabular-nums">{value}</p>
            <p className="text-xs text-zinc-400 mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart + Traffic Sources */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Weekly Overview</p>
              <p className="text-xs text-zinc-400 mt-0.5">Profile views by day</p>
            </div>
            <TrendingUp className="w-4 h-4 text-zinc-300" />
          </div>
          {dailyData.length > 0 ? (
            <>
              <div className="flex items-end gap-1.5 h-36 px-1">
                {dailyData.map(([day, count], idx) => {
                  const pct = count > 0 ? Math.max((count / maxDaily) * 100, 6) : 0;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center justify-end gap-1 group h-full">
                      {count > 0 && (
                        <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums leading-none">
                          {count}
                        </span>
                      )}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: pct > 0 ? `${pct}%` : "2px" }}
                        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 + idx * 0.04 }}
                        title={`${count} views`}
                        className="w-full rounded-t-md cursor-default transition-opacity"
                        style={{
                          background: pct > 0 ? BAR_COLOR : "#e4e4e7",
                          opacity: pct > 0 ? 1 : 0.5,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1.5 mt-3 px-1">
                {dailyData.map(([day]) => (
                  <span key={day} className="flex-1 text-center text-[10px] text-zinc-400">
                    {new Date(day).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="w-8 h-8 text-zinc-200" />
              <p className="text-sm text-zinc-400">No view data yet</p>
            </div>
          )}
        </motion.div>

        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm"
        >
          <div className="mb-5">
            <p className="text-sm font-semibold text-zinc-900">Traffic Sources</p>
            <p className="text-xs text-zinc-400 mt-0.5">Visitor breakdown</p>
          </div>
          <div className="space-y-5">
            {devicesOrFallback.map(([name, value], idx) => {
              const total = devicesOrFallback.reduce((acc, [, v]) => acc + Number(v), 0) || 1;
              const pct = Math.min(Math.round((Number(value) / total) * 100), 100);
              return (
                <div key={String(name)}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] text-zinc-700 capitalize font-medium">{String(name)}</span>
                    <span className="text-[13px] text-zinc-400 tabular-nums">{pct}%</span>
                  </div>
                  <TrackBar pct={pct} colorIdx={idx} delay={0.4} />
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Devices + Referrers */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Devices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm"
        >
          <div className="mb-5">
            <p className="text-sm font-semibold text-zinc-900">Devices</p>
            <p className="text-xs text-zinc-400 mt-0.5">By device type</p>
          </div>
          <div className="space-y-4">
            {devicesOrFallback.map(([name, value], idx) => {
              const total = devicesOrFallback.reduce((acc, [, v]) => acc + Number(v), 0) || 1;
              const pct = Math.min(Math.round((Number(value) / total) * 100), 100);
              const tc = TRACK_COLORS[idx % TRACK_COLORS.length];
              return (
                <div key={String(name)} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tc.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] text-zinc-700 capitalize font-medium truncate">{String(name)}</span>
                      <span className="text-xs text-zinc-400 tabular-nums ml-2 shrink-0">{String(value)}</span>
                    </div>
                    <TrackBar pct={pct} colorIdx={idx} delay={0.45} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Referrers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm"
        >
          <div className="mb-4">
            <p className="text-sm font-semibold text-zinc-900">Recent Referrers</p>
            <p className="text-xs text-zinc-400 mt-0.5">Where visitors come from</p>
          </div>
          {referrers.length > 0 ? (
            <div className="divide-y divide-zinc-50">
              {referrers.slice(0, 6).map((r, i) => (
                <div key={`${r.url}-${i}`} className="flex items-center justify-between py-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center text-[11px] text-zinc-500 font-semibold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[13px] text-zinc-500 truncate group-hover:text-zinc-900 transition-colors">{r.url}</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-600 tabular-nums ml-4 shrink-0 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center gap-2">
              <TrendingUp className="w-7 h-7 text-zinc-200" />
              <p className="text-sm text-zinc-400">No referrer data yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics;