import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Activity, Building2, CreditCard, Users, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, apiRequestWithFallback } from "@/lib/api";

type OverviewResponse = {
  overview: {
    period_days: number;
    totals: {
      companies: number;
      users: number;
      cards: number;
      events: number;
    };
    new_in_period: {
      companies: number;
      users: number;
      cards: number;
    };
    status_breakdown: {
      active: number;
      inactive: number;
      suspended: number;
    };
    events_by_day: Record<string, number>;
    top_companies: Array<{
      company_id: string;
      name: string;
      events: number;
      users: number;
      cards: number;
    }>;
    top_users: Array<{
      user_id: string;
      name: string;
      email: string;
      role: string;
      events: number;
      company?: string | null;
    }>;
    company_options: Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
    }>;
  };
};

const AdminAnalytics = () => {
  const [days, setDays] = useState(30);
  const [companyId, setCompanyId] = useState("all");
  const [role, setRole] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewResponse["overview"] | null>(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const params = new URLSearchParams();
      params.set("days", String(days));
      if (companyId !== "all") params.set("company_id", companyId);
      if (role !== "all") params.set("role", role);
      if (startDate && endDate) {
        params.set("start_date", startDate);
        params.set("end_date", endDate);
      }

      const overviewData = await apiRequestWithFallback<OverviewResponse["overview"]>([
        async () => {
          const response = await apiRequest<OverviewResponse>(`/api/admin/analytics/overview?${params.toString()}`, {
            headers: authHeaders,
          });
          return response.overview;
        },
        async () => {
          const [statsResponse, companiesResponse] = await Promise.all([
            apiRequest<{
              stats: {
                total_companies: number;
                total_users: number;
                total_cards: number;
                by_role: { admin: number; company_admin: number; employee: number };
              };
            }>("/api/admin/stats", { headers: authHeaders }),
            apiRequest<{ companies: Array<{ id: string; name: string; slug: string; status: string }> }>("/api/admin/companies?per_page=200", {
              headers: authHeaders,
            }).catch(() => ({ companies: [] })),
          ]);

          const eventsByDay: Record<string, number> = {};
          for (let offset = 0; offset < days; offset += 1) {
            const day = new Date(Date.now() - (days - 1 - offset) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            eventsByDay[day] = 0;
          }

          const roleCount = role === "admin"
            ? statsResponse.stats.by_role.admin
            : role === "company_admin"
            ? statsResponse.stats.by_role.company_admin
            : role === "employee"
            ? statsResponse.stats.by_role.employee
            : statsResponse.stats.total_users;

          return {
            period_days: days,
            totals: {
              companies: companyId === "all" ? statsResponse.stats.total_companies : companiesResponse.companies.filter((company) => company.id === companyId).length,
              users: roleCount,
              cards: statsResponse.stats.total_cards,
              events: 0,
            },
            new_in_period: {
              companies: 0,
              users: 0,
              cards: 0,
            },
            status_breakdown: {
              active: 0,
              inactive: 0,
              suspended: 0,
            },
            events_by_day: eventsByDay,
            top_companies: [],
            top_users: [],
            company_options: companiesResponse.companies || [],
          };
        },
      ]);

      setOverview(overviewData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load analytics overview";
      setOverview(null);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [days, companyId, role, startDate, endDate]);

  const downloadCsv = (fileName: string, rows: Array<Record<string, string | number>>) => {
    if (rows.length === 0) {
      toast.error("No data available for export");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header] ?? "").replace(/"/g, '""');
            return `"${value}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSnapshotCsv = () => {
    if (!overview) {
      toast.error("No analytics data available for snapshot export");
      return;
    }

    const rows: Array<Record<string, string | number>> = [];

    rows.push({ section: "Summary", metric: "Period Days", value: overview.period_days });
    rows.push({ section: "Summary", metric: "Total Companies", value: overview.totals.companies });
    rows.push({ section: "Summary", metric: "Total Users", value: overview.totals.users });
    rows.push({ section: "Summary", metric: "Total Cards", value: overview.totals.cards });
    rows.push({ section: "Summary", metric: "Total Events", value: overview.totals.events });

    rows.push({ section: "New In Period", metric: "Companies", value: overview.new_in_period.companies });
    rows.push({ section: "New In Period", metric: "Users", value: overview.new_in_period.users });
    rows.push({ section: "New In Period", metric: "Cards", value: overview.new_in_period.cards });

    rows.push({ section: "Status Breakdown", metric: "Active", value: overview.status_breakdown.active });
    rows.push({ section: "Status Breakdown", metric: "Inactive", value: overview.status_breakdown.inactive });
    rows.push({ section: "Status Breakdown", metric: "Suspended", value: overview.status_breakdown.suspended });

    Object.entries(overview.events_by_day).forEach(([date, value]) => {
      rows.push({ section: "Events By Day", metric: date, value });
    });

    overview.top_companies.forEach((company, index) => {
      rows.push({
        section: "Top Companies",
        metric: `${index + 1}. ${company.name}`,
        value: company.events,
      });
    });

    overview.top_users.forEach((user, index) => {
      rows.push({
        section: "Top Users",
        metric: `${index + 1}. ${user.name} (${user.role})`,
        value: user.events,
      });
    });

    const dateLabel = new Date().toISOString().slice(0, 10);
    downloadCsv(`analytics-snapshot-${dateLabel}.csv`, rows);
  };

  const activitySeries = overview
    ? Object.entries(overview.events_by_day).map(([date, value]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        events: value,
      }))
    : [];

  if (loading) {
    return <Card className="p-8 text-center text-muted-foreground">Loading analytics...</Card>;
  }

  if (!overview) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">{errorMessage || "Failed to load analytics"}</p>
        <Button variant="outline" size="sm" onClick={loadOverview}>Retry</Button>
      </Card>
    );
  }

  const kpis = [
    {
      title: "Companies",
      value: overview.totals.companies,
      delta: `+${overview.new_in_period.companies} in ${overview.period_days}d`,
      icon: Building2,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      title: "Users",
      value: overview.totals.users,
      delta: `+${overview.new_in_period.users} in ${overview.period_days}d`,
      icon: Users,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Cards",
      value: overview.totals.cards,
      delta: `+${overview.new_in_period.cards} in ${overview.period_days}d`,
      icon: CreditCard,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      title: "Events",
      value: overview.totals.events,
      delta: `Traffic over ${overview.period_days}d`,
      icon: Activity,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cross-company and cross-user performance intelligence</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={downloadSnapshotCsv}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Snapshot
          </Button>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All companies</option>
            {overview.company_options.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="company_admin">Company Admin</option>
            <option value="employee">Employee</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setCompanyId("all");
              setRole("all");
              setDays(30);
            }}
          >
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={loadOverview}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item) => (
          <Card key={item.title} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.title}</p>
                <p className="font-heading text-3xl font-bold text-foreground mt-1">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.delta}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.tone}`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 xl:col-span-2">
          <h2 className="font-heading font-semibold text-foreground mb-4">Platform Activity Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={activitySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="events" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="font-heading font-semibold text-foreground mb-4">User Status Mix</h2>
          <div className="space-y-4">
            {Object.entries(overview.status_breakdown).map(([key, value]) => {
              const total = Math.max(1, overview.totals.users);
              const pct = Math.round((value / total) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize text-muted-foreground">{key}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Top Companies by Events</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "top-companies.csv",
                  overview.top_companies.map((company) => ({
                    name: company.name,
                    events: company.events,
                    users: company.users,
                    cards: company.cards,
                  }))
                )
              }
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
          </div>
          {overview.top_companies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity data for selected period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={overview.top_companies}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="events" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Top Users by Activity</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "top-users.csv",
                  overview.top_users.map((user) => ({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    company: user.company || "",
                    events: user.events,
                  }))
                )
              }
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
          </div>
          {overview.top_users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user activity data for selected period.</p>
          ) : (
            <div className="space-y-2">
              {overview.top_users.map((user) => (
                <div key={user.user_id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email} · {user.company || "No company"}</p>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{user.events}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;
