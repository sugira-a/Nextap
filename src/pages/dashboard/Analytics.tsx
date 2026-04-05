import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import { Eye, MousePointer, Download, Globe, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

const Analytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const me = await apiRequest<{ user: { id: string } }>("/api/auth/me", { headers });
        const data = await apiRequest<{ analytics: any }>(`/api/analytics/user/${me.user.id}?days=30`, { headers });
        setAnalytics(data.analytics);
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading || !analytics) {
    return <div className="p-6 text-muted-foreground">Loading analytics...</div>;
  }

  const dailyData = Object.entries(analytics.views_by_day || {}).slice(-7);
  const devices = Object.entries(analytics.device_breakdown || {});
  const locations = analytics.recent_events?.slice(0, 5).map((event: any, index: number) => ({
    city: event.referrer || `Event ${index + 1}`,
    views: 1,
  })) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Track how people interact with your card</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="Profile Views" value={(analytics.profile_views || 0).toLocaleString()} icon={Eye} change="Live data" />
        <StatCard title="Card Taps" value={(analytics.taps || 0).toLocaleString()} icon={MousePointer} change="Live data" />
        <StatCard title="Contacts Saved" value={(analytics.total_events || 0).toLocaleString()} icon={Download} change="Event volume" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4">Weekly Overview</h2>
          <div className="grid grid-cols-7 gap-2 items-end h-40">
            {dailyData.length > 0 ? dailyData.map(([day, count]) => (
              <div key={day} className="flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full bg-accent rounded-t" style={{ height: `${Math.max(Number(count) * 10, 10)}%` }} />
                <span className="text-[10px] text-muted-foreground">{new Date(day).toLocaleDateString("en-US", { weekday: "short" })}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4">Traffic Sources</h2>
          <div className="space-y-3">
            {(devices.length > 0 ? devices : [["unknown", 0]]).map(([name, value]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-foreground capitalize">{name}</span>
                  <span className="text-muted-foreground">{String(value)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: `${Math.max(Number(value) * 10, 5)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-muted-foreground" /> Devices
          </h2>
          <div className="space-y-3">
            {(devices.length > 0 ? devices : [["unknown", 0]]).map(([name, value]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium text-foreground capitalize">{name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-secondary rounded-full h-1.5">
                    <div className="bg-accent h-1.5 rounded-full" style={{ width: `${Math.min(Number(value) * 10, 100)}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-10 text-right">{String(value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" /> Recent Referrers
          </h2>
          <div className="space-y-1">
            {locations.length > 0 ? locations.map((l, i) => (
              <div key={`${l.city}-${i}`} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm text-foreground">{l.city}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{l.views}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No referrer data yet.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;