import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

const CompanyAnalytics = () => {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<any>(`/api/analytics/company/${companyId}?days=${days}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setAnalytics(data.analytics);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const eventsByDayData = analytics
    ? Object.entries(analytics.events_by_day).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        events: count,
      }))
    : [];

  const topCardsData = analytics ? analytics.top_cards.slice(0, 5) : [];

  const deviceData = Object.entries(analytics?.device_breakdown || {}).map(([device, count]) => ({
    name: device,
    value: count,
  }));

  if (!analytics || loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Events",
      value: analytics.total_events,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Card Taps",
      value: analytics.taps,
      color: "bg-green-50 text-green-700",
    },
    {
      title: "Profile Views",
      value: analytics.profile_views,
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "Unique Devices",
      value: analytics.unique_devices.length,
      color: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Monitor card engagement and user activity
            </p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <Card key={stat.title} className={`p-6 ${stat.color}`}>
            <p className="text-sm opacity-75 mb-1">{stat.title}</p>
            <p className="font-heading font-bold text-3xl">{stat.value}</p>
          </Card>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Activity Timeline</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={eventsByDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: "#22C55E" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Device Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Device Distribution</h2>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <p>No device data available</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Top Performing Cards</h2>
          {topCardsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCardsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="card_id" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="hits" fill="#22C55E" name="Hits" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              <p>No card data available yet</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Event Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Taps</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.taps}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {((analytics.taps / analytics.total_events) * 100).toFixed(1)}% of total events
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Profile Views</h3>
            <p className="text-3xl font-bold text-purple-600">{analytics.profile_views}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {((analytics.profile_views / analytics.total_events) * 100).toFixed(1)}% of total events
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Devices</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.unique_devices.length}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {(analytics.unique_devices || []).join(", ") || "No device details yet"}
            </p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default CompanyAnalytics;
