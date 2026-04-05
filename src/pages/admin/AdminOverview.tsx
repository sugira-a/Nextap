import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Activity, CreditCard, Eye, TrendingUp, Users, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";

type AdminStats = {
  total_companies: number;
  active_companies: number;
  total_users: number;
  total_cards: number;
  claimed_cards: number;
  active_cards: number;
  by_role: {
    admin: number;
    company_admin: number;
    employee: number;
  };
};

type AdminAuditLog = {
  id: string;
  action: string;
  target_type: string;
  timestamp?: string;
  actor?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
};

type AdminCard = {
  code: string;
  status: string;
  assigned_user_id?: string | null;
};

const AdminOverview = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [topCards, setTopCards] = useState<AdminCard[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsResponse, logsResponse, cardsResponse] = await Promise.all([
          apiRequest<{ stats: AdminStats }>("/api/admin/stats", { headers: authHeaders }),
          apiRequest<{ audit_logs: AdminAuditLog[] }>("/api/admin/audit-logs?per_page=5", { headers: authHeaders }),
          apiRequest<{ cards: AdminCard[] }>("/api/admin/cards?per_page=5", { headers: authHeaders }),
        ]);

        setStats(statsResponse.stats);
        setLogs(logsResponse.audit_logs || []);
        setTopCards(cardsResponse.cards || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load admin overview");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authHeaders]);

  if (loading || !stats) {
    return <div className="p-6 text-muted-foreground">Loading admin overview...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and live metrics</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.total_users.toString()} icon={Users} change={`Admins: ${stats.by_role.admin}`} />
        <StatCard title="Total Cards" value={stats.total_cards.toString()} icon={CreditCard} />
        <StatCard title="Companies" value={stats.total_companies.toString()} icon={Building2} change={`${stats.active_companies} active`} />
        <StatCard title="Claimed Cards" value={stats.claimed_cards.toString()} icon={Activity} change={`${stats.active_cards} active`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">System Roles</h2>
            <div className="flex items-center gap-1 text-xs text-accent"><TrendingUp className="w-3 h-3" /> Live</div>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.by_role).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                <span className="text-sm capitalize text-foreground">{role.replace("_", " ")}</span>
                <Badge className="bg-accent/10 text-accent border-0">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="space-y-1">
            {logs.length > 0 ? logs.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm text-foreground"><span className="font-medium">{item.action}</span> <span className="text-muted-foreground">{item.target_type}</span></p>
                  <p className="text-xs text-muted-foreground">{item.actor?.email || "System"}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.timestamp ? new Date(item.timestamp).toLocaleString() : "—"}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No audit logs yet.</p>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-foreground">Top Cards</h2>
          <Link to="/admin/cards" className="flex items-center gap-1 text-xs text-accent hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Card</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {topCards.map((card) => (
                <tr key={card.code} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-mono font-medium text-foreground">{card.code}</td>
                  <td className="py-2.5 text-muted-foreground capitalize">{card.status}</td>
                  <td className="py-2.5 text-muted-foreground">{card.assigned_user_id ? card.assigned_user_id.slice(0, 8) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminOverview;