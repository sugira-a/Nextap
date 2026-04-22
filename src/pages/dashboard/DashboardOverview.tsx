import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { UserCircle2, TrendingUp, CreditCard, Users, BarChart3, Eye } from "lucide-react";
import { apiRequest, getUserIdFromToken } from "@/lib/api";

type UserAnalytics = {
  total_events: number;
  profile_views: number;
  taps: number;
  views_by_day: Record<string, number>;
  recent_events: Array<{
    event_type: string;
    device_type?: string | null;
    browser?: string | null;
    referrer?: string | null;
    timestamp?: string | null;
  }>;
};

const BAR_COLOR = "#1e3a5f";

const quickActions = [
  { label: "Edit Profile",     path: "/dashboard/profile",   desc: "Update your info and bio",        Icon: UserCircle2 },
  { label: "View Analytics",   path: "/dashboard/analytics", desc: "Track card performance",          Icon: TrendingUp  },
  { label: "My Card",          path: "/dashboard/card",      desc: "Manage your NFC card",            Icon: CreditCard  },
  { label: "Contacts",         path: "/dashboard/contacts",  desc: "People who saved your contact",   Icon: Users       },
];

const DashboardOverview = () => {
  const [completion, setCompletion] = useState(0);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const userId = getUserIdFromToken();
        if (userId) {
          const [me, analyticsResponse] = await Promise.all([
            apiRequest<{ user: { id: string }; profile: { completion_status?: number } | null }>("/api/auth/me", { headers }),
            apiRequest<{ analytics: UserAnalytics }>(`/api/analytics/user/${userId}?days=30`, { headers }),
          ]);
          setCompletion(me.profile?.completion_status || 0);
          setAnalytics(analyticsResponse.analytics);
        } else {
          const me = await apiRequest<{ user: { id: string }; profile: { completion_status?: number } | null }>("/api/auth/me", { headers });
          setCompletion(me.profile?.completion_status || 0);
          const analyticsResponse = await apiRequest<{ analytics: UserAnalytics }>(`/api/analytics/user/${me.user.id}?days=30`, { headers });
          setAnalytics(analyticsResponse.analytics);
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
        <div className="w-5 h-5 rounded-full border-2 border-zinc-200 border-t-zinc-600 animate-spin" />
      </div>
    );
  }

  const weeklyData = Object.entries(analytics?.views_by_day || {}).slice(-7);
  const recentActivity = analytics?.recent_events?.slice(0, 5) || [];
  const maxDailyViews = Math.max(...Object.values(analytics?.views_by_day || {}).map(Number), 1);

  const stats = [
    { label: "Profile Views", value: (analytics?.profile_views || 0).toLocaleString(), sub: "Total all time"    },
    { label: "Card Taps",     value: (analytics?.taps || 0).toLocaleString(),           sub: "NFC interactions" },
    { label: "Events",        value: (analytics?.total_events || 0).toLocaleString(),   sub: "Last 30 days"     },
    { label: "Completion",    value: `${completion}%`,                                  sub: completion >= 80 ? "Profile complete" : "Keep filling in" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-6 py-2"
    >
      {/* Header */}
      <div className="flex items-end justify-between pb-5 border-b border-zinc-100">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">Overview</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
        </div>
        <Link
          to="/dashboard/profile"
          className="text-sm font-semibold text-zinc-700 border border-zinc-200 bg-white px-4 py-2 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-sm"
        >
          Edit Profile
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white border border-zinc-200 rounded-2xl px-5 py-6 flex flex-col gap-1 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">{label}</p>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight mt-2 tabular-nums">{value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Middle Row: Chart + Actions */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Views this week</p>
              <p className="text-xs text-zinc-400 mt-0.5">Daily profile views</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              Live
            </span>
          </div>

          {weeklyData.length > 0 ? (
            <>
              <div className="flex items-end gap-2 h-36 px-1">
                {weeklyData.map(([day, count], idx) => {
                  const pct = Math.max((Number(count) / maxDailyViews) * 100, 4);
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center justify-end gap-1 group h-full">
                      <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums leading-none">
                        {String(count)}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 + idx * 0.05 }}
                        title={`${count} views`}
                        className="w-full rounded-t-md cursor-default"
                        style={{ background: BAR_COLOR, minHeight: "4px" }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-3 px-1">
                {weeklyData.map(([day]) => (
                  <span key={day} className="flex-1 text-center text-[11px] text-zinc-400">
                    {new Date(day).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="w-8 h-8 text-zinc-200" />
              <p className="text-sm text-zinc-400">No view data yet</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col shadow-sm"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-3">Quick Actions</p>
          <div className="flex flex-col gap-0.5 flex-1">
            {quickActions.map(({ label, path, desc, Icon }) => (
              <Link
                key={path}
                to={path}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-800 group-hover:text-zinc-900 leading-snug">{label}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{desc}</p>
                </div>
                <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors text-base leading-none">→</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Completion + Activity */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Profile Completion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-0.5">Profile Completion</p>
          <p className="text-xs text-zinc-400 mb-5">Fill in all fields to reach 100%</p>

          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="text-5xl font-bold text-zinc-900 tracking-tight tabular-nums">{completion}</span>
            <span className="text-xl font-semibold text-zinc-400">%</span>
          </div>

          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ type: "spring", stiffness: 40, damping: 25, delay: 0.5 }}
              className="h-full rounded-full"
              style={{ background: "#1e3a5f" }}
            />
          </div>

          <p className="text-xs text-zinc-400 mt-2.5">
            {completion >= 100 ? "Your profile is complete." : `${100 - completion}% remaining`}
          </p>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm"
        >
          <p className="text-sm font-semibold text-zinc-900 mb-1">Recent Activity</p>
          <p className="text-xs text-zinc-400 mb-4">Latest interactions on your profile</p>

          {recentActivity.length > 0 ? (
            <div className="divide-y divide-zinc-50">
              {recentActivity.map((item, i) => (
                <div key={`${item.timestamp}-${i}`} className="flex items-center justify-between py-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                      <Eye className="w-3 h-3 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] text-zinc-800 capitalize font-medium truncate">
                        {item.event_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {item.device_type || item.browser || item.referrer || "Direct"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400 ml-4 whitespace-nowrap tabular-nums bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">
                    {item.timestamp
                      ? new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center gap-2">
              <TrendingUp className="w-7 h-7 text-zinc-200" />
              <p className="text-sm text-zinc-400">No recent activity yet</p>
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
};

export default DashboardOverview;