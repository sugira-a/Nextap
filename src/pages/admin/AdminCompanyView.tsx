import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Users, CreditCard, Armchair, Mail } from "lucide-react";

import { apiRequest, apiRequestWithFallback } from "@/lib/api";
import { Button } from "@/components/ui/button";

type CompanyDetails = {
  company: {
    id: string; name: string; slug: string; plan: string; subscription_seats: number;
    primary_color?: string; accent_color?: string; created_at?: string;
  };
  stats?: { employee_count?: number; card_count?: number; invitation_count?: number };
  members?: Array<{ id: string; first_name: string; last_name: string; email: string }>;
};

const planColor: Record<string, string> = {
  starter: "bg-sky-50 text-sky-600",
  professional: "bg-violet-50 text-violet-600",
  enterprise: "bg-amber-50 text-amber-600",
};

const AdminCompanyView = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CompanyDetails | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const response = await apiRequestWithFallback<CompanyDetails>([
        () => apiRequest<CompanyDetails>(`/api/admin/companies/${companyId}`, { headers: authHeaders }),
        () => apiRequest<CompanyDetails>(`/api/company/${companyId}`, { headers: authHeaders }),
      ]);
      setData(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [companyId]);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
    </div>
  );
  if (!data) return <p className="text-sm text-muted-foreground py-8 text-center">Company not found</p>;

  const initials = data.company.name.slice(0, 2).toUpperCase();
  const plan = data.company.plan?.toLowerCase() ?? "starter";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-4 px-3 py-2 sm:px-0"
    >
      {/* Back */}
      <div className="flex justify-end pt-1">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <Link to="/admin/companies">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to companies
          </Link>
        </Button>
      </div>

      {/* Dark header */}
      <div className="rounded-xl bg-[#0f172a] px-4 py-3.5 flex items-center gap-3 sm:px-5 sm:py-4">
        <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-white font-semibold text-xs shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-white leading-tight truncate">{data.company.name}</h1>
          <p className="text-xs font-mono text-white/40 truncate">/{data.company.slug}</p>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${planColor[plan] ?? "bg-muted text-muted-foreground"}`}>
          {data.company.plan}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          { label: "Seats", value: data.company.subscription_seats, icon: Armchair, color: "bg-violet-50 text-violet-500" },
          { label: "Users", value: data.stats?.employee_count ?? 0, icon: Users, color: "bg-blue-50 text-blue-500" },
          { label: "Cards", value: data.stats?.card_count ?? 0, icon: CreditCard, color: "bg-emerald-50 text-emerald-500" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            className="rounded-xl border border-border/60 bg-background px-4 py-3 flex items-center gap-3 shadow-sm shadow-zinc-100/60"
          >
            <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${color}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="text-base font-semibold text-foreground leading-tight">{value}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Members */}
      {data.members && data.members.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-background overflow-hidden shadow-sm shadow-zinc-100/60">
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-900">Members</p>
              <input
                type="search"
                placeholder="Search members by name or email"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="text-sm border border-zinc-200 rounded-xl px-3 py-2 outline-none w-full sm:w-64 focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>
          <div className="divide-y divide-border/40">
            {data.members.filter(m => {
              const q = memberSearch.trim().toLowerCase();
              if (!q) return true;
              const name = `${m.first_name} ${m.last_name}`.toLowerCase();
              return name.includes(q) || m.email.toLowerCase().includes(q);
            }).map(m => (
              <div key={m.id} className="flex items-center justify-between py-3 px-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{m.first_name} {m.last_name}</p>
                  <p className="text-xs text-zinc-400">{m.email}</p>
                </div>
                <Link to={`/admin/users/${m.id}`} className="text-xs text-zinc-500 hover:text-zinc-900">View →</Link>
              </div>
            ))}
            {data.members.filter(m => {
              const q = memberSearch.trim().toLowerCase();
              if (!q) return false;
              const name = `${m.first_name} ${m.last_name}`.toLowerCase();
              return name.includes(q) || m.email.toLowerCase().includes(q);
            }).length === 0 && (
              <div className="py-4 px-4 text-sm text-zinc-400">No members match your search</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminCompanyView;