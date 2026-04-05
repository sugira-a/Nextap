import { useEffect, useState } from "react";
import { ArrowRight, CreditCard, Eye, MousePointer, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

const quickActions = [
  { label: "Edit Profile", path: "/dashboard/profile", desc: "Update your info and bio" },
  { label: "Manage Links", path: "/dashboard/links", desc: "Add or edit social links" },
  { label: "Customize Design", path: "/dashboard/appearance", desc: "Change colors and style" },
  { label: "View Analytics", path: "/dashboard/analytics", desc: "Track card performance" },
];

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

const DashboardOverview = () => {
  const [name, setName] = useState("User");
  const [completion, setCompletion] = useState(0);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const me = await apiRequest<{ user: { id: string; first_name: string; last_name: string }; profile: { completion_status?: number } | null }>("/api/auth/me", { headers });
        setName(`${me.user.first_name} ${me.user.last_name}`.trim());
        setCompletion(me.profile?.completion_status || 0);

        const analyticsResponse = await apiRequest<{ analytics: UserAnalytics }>(`/api/analytics/user/${me.user.id}?days=30`, { headers });
        setAnalytics(analyticsResponse.analytics);
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading dashboard...</div>;
  }

  const weeklyData = Object.entries(analytics?.views_by_day || {}).slice(-7);
  const recentActivity = analytics?.recent_events || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back, {name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Here&apos;s how your card is performing</p>
        </div>
        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/dashboard/profile">Edit Profile</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Views" value={(analytics?.profile_views || 0).toLocaleString()} icon={Eye} change="Live data" />
        <StatCard title="Card Taps" value={(analytics?.taps || 0).toLocaleString()} icon={MousePointer} change="Live data" />
        <StatCard title="Events" value={(analytics?.total_events || 0).toLocaleString()} icon={Users} change="Last 30 days" />
        <StatCard title="Profile Completion" value={`${completion}%`} icon={CreditCard} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-foreground">Profile Completion</h2>
            <span className="text-sm font-bold text-accent">{completion}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
            <div className="bg-accent h-2.5 rounded-full transition-all" style={{ width: `${completion}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">Completion is calculated from your saved profile data.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action, i) => (
              <Link key={i} to={action.path} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group">
                <div>
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Views This Week</h2>
            <div className="flex items-center gap-1 text-xs text-accent"><TrendingUp className="w-3 h-3" /> Live</div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.length > 0 ? weeklyData.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-accent/20 relative" style={{ height: `${Math.max(Number(count) * 10, 12)}%` }}>
                  <div className="absolute bottom-0 w-full rounded-t-md bg-accent" style={{ height: `${Math.max(Number(count) * 10, 12)}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No view activity yet.</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-1">
            {recentActivity.length > 0 ? recentActivity.map((item, i) => (
              <div key={`${item.timestamp}-${i}`} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm text-foreground">{item.event_type.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{item.device_type || item.browser || item.referrer || "Direct"}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.timestamp ? new Date(item.timestamp).toLocaleString() : "—"}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No recent activity yet.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardOverview;