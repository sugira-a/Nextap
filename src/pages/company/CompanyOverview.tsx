import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Activity, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
  const [stats, setStats] = useState({
    total_employees: 0,
    active_employees: 0,
    total_cards: 0,
    active_cards: 0,
    claimed_cards: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [company, setCompany] = useState<CompanyMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    try {
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<{ stats: typeof stats }>(`/api/company/${companyId}/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setStats(data.stats);

      const companyResponse = await apiRequest<{ company: CompanyMeta }>(`/api/company/${companyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCompany(companyResponse.company);
    } catch (error) {
      toast.error("Failed to load statistics");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<{ analytics: { events_by_day: Record<string, number> } }>(
        `/api/analytics/company/${companyId}?days=30`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      const chartData = Object.entries(data.analytics.events_by_day).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        events: count,
      }));
      setAnalyticsData(chartData);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Employees",
      value: stats.total_employees,
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      title: "Active Cards",
      value: stats.active_cards,
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "NFC Cards",
      value: stats.total_cards,
      icon: CreditCard,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Claimed Cards",
      value: stats.claimed_cards,
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading company dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace</p>
              <h1 className="font-heading font-bold text-3xl mt-1">{company?.name || "Company Dashboard"}</h1>
              <p className="text-muted-foreground mt-1">/{company?.slug || "company"}</p>
            </div>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-foreground capitalize">
                <Building2 className="w-3.5 h-3.5" /> {company?.plan || "starter"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-foreground capitalize">
                {company?.status || "active"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-foreground">
                Seats {company?.subscription_seats ?? 0}
              </span>
            </div>
          </div>
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
          <Card key={stat.title} className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="font-heading font-bold text-3xl tracking-tight">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Activity (Last 30 Days)</h2>
            {analyticsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                <p>No activity data yet</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Card Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Card Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-medium">{stats.active_cards}</span>
                </div>
                <div className="bg-border rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${stats.total_cards > 0 ? (stats.active_cards / stats.total_cards) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Unclaimed</span>
                  <span className="font-medium">{stats.total_cards - stats.claimed_cards}</span>
                </div>
                <div className="bg-border rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.total_cards > 0
                          ? ((stats.total_cards - stats.claimed_cards) / stats.total_cards) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <a href="/company/invitations">Invite Employee</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/company/cards">Manage Cards</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/company/settings">Company Settings</a>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompanyOverview;
