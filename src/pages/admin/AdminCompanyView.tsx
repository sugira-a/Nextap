import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { apiRequest, apiRequestWithFallback } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type CompanyResponse = {
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    plan: string;
    status: string;
    subscription_seats: number;
    primary_color: string;
    accent_color: string;
    created_at?: string;
  };
  stats: {
    employee_count: number;
    card_count: number;
    invitation_count: number;
    claimed_cards: number;
    active_cards: number;
  };
  members: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
    profile?: {
      photo_url?: string | null;
      title?: string | null;
    } | null;
  }>;
};

type CompanyFallbackResponse = {
  company: CompanyResponse["company"];
  stats?: {
    total_employees?: number;
    total_cards?: number;
    active_cards?: number;
  };
};

type CompanyMembersResponse = {
  members: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
  }>;
};

const AdminCompanyView = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [data, setData] = useState<CompanyResponse | null>(null);
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    plan: "starter",
    subscription_seats: 5,
    primary_color: "#000000",
    accent_color: "#22C55E",
  });

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const applyCompanyData = (companyData: CompanyResponse) => {
    setData(companyData);
    setForm({
      name: companyData.company.name || "",
      logo_url: companyData.company.logo_url || "",
      plan: companyData.company.plan || "starter",
      subscription_seats: companyData.company.subscription_seats || 5,
      primary_color: companyData.company.primary_color || "#000000",
      accent_color: companyData.company.accent_color || "#22C55E",
    });
  };

  const load = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const response = await apiRequestWithFallback<CompanyResponse>([
        () => apiRequest<CompanyResponse>(`/api/admin/companies/${companyId}`, { headers: authHeaders }),
        async () => {
          const [companyResponse, membersResponse] = await Promise.all([
            apiRequest<CompanyFallbackResponse>(`/api/company/${companyId}`, {
              headers: authHeaders,
            }),
            apiRequest<CompanyMembersResponse>(`/api/company/${companyId}/members?per_page=100`, {
              headers: authHeaders,
            }).catch(() => ({ members: [] })),
          ]);

          return {
            company: companyResponse.company,
            stats: {
              employee_count: companyResponse.stats?.total_employees || membersResponse.members.length,
              card_count: companyResponse.stats?.total_cards || 0,
              invitation_count: 0,
              claimed_cards: 0,
              active_cards: companyResponse.stats?.active_cards || 0,
            },
            members: membersResponse.members.map((member) => ({
              ...member,
              profile: null,
            })),
          };
        },
      ]);

      applyCompanyData(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [companyId]);

  const save = async () => {
    if (!companyId) return;

    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      setSaving(true);
      await apiRequest(`/api/company/${companyId}/update`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          name: form.name.trim(),
          logo_url: form.logo_url.trim() || null,
          plan: form.plan,
          subscription_seats: Number(form.subscription_seats) || 5,
          primary_color: form.primary_color,
          accent_color: form.accent_color,
        }),
      });
      toast.success("Company updated");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!companyId || !data) return;

    const confirmed = window.confirm(`Delete workspace ${data.company.name}? This will deactivate the company and detach users/cards.`);
    if (!confirmed) return;

    try {
      setDeleting(true);
      await apiRequest(`/api/company/${companyId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      toast.success("Company workspace deleted");
      navigate("/admin/companies");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete company");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-muted-foreground">Loading company...</Card>;
  }

  if (!data) {
    return <Card className="p-8 text-center text-muted-foreground">Company not found</Card>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/companies">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Companies
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={remove} disabled={deleting}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {deleting ? "Deleting..." : "Delete"}
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Company logo" className="h-16 w-16 rounded-lg object-cover border border-border" />
          ) : (
            <div className="h-16 w-16 rounded-lg border border-border flex items-center justify-center bg-secondary text-muted-foreground text-xs">No logo</div>
          )}
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold text-foreground">{data.company.name}</h1>
            <p className="text-sm text-muted-foreground">/{data.company.slug}</p>
            <div className="flex gap-2 text-xs">
              <Badge className="capitalize">{data.company.plan}</Badge>
              <Badge variant="secondary" className="capitalize">{data.company.status}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2 space-y-4">
          <h2 className="font-heading font-semibold">Workspace Settings</h2>

          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Company Name" />
          <Input value={form.logo_url} onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))} placeholder="Logo URL" />

          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.plan} onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="starter">starter</option>
              <option value="professional">professional</option>
              <option value="enterprise">enterprise</option>
            </select>
            <Input type="number" min={1} value={form.subscription_seats} onChange={(e) => setForm((p) => ({ ...p, subscription_seats: Number(e.target.value) || 1 }))} placeholder="Seats" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color} onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))} className="h-10 w-14 rounded border border-input" />
              <Input value={form.primary_color} onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={form.accent_color} onChange={(e) => setForm((p) => ({ ...p, accent_color: e.target.value }))} className="h-10 w-14 rounded border border-input" />
              <Input value={form.accent_color} onChange={(e) => setForm((p) => ({ ...p, accent_color: e.target.value }))} />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-heading font-semibold">Workspace Stats</h2>
          <div className="text-sm">
            <p className="text-muted-foreground">Employees</p>
            <p className="font-medium">{data.stats.employee_count}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Cards</p>
            <p className="font-medium">{data.stats.card_count}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Active Cards</p>
            <p className="font-medium">{data.stats.active_cards}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Claimed Cards</p>
            <p className="font-medium">{data.stats.claimed_cards}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Pending Invitations</p>
            <p className="font-medium">{data.stats.invitation_count}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{data.company.created_at ? new Date(data.company.created_at).toLocaleString() : "-"}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-heading font-semibold mb-4">Team Members</h2>
        {data.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members found for this company.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.members.map((member) => (
              <div key={member.id} className="rounded-lg border border-border p-3 flex items-center gap-3">
                {member.profile?.photo_url ? (
                  <img src={member.profile.photo_url} alt={`${member.first_name} ${member.last_name}`} className="h-10 w-10 rounded-full object-cover border border-border" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">
                    {member.first_name[0]}{member.last_name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.first_name} {member.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{member.role.replace("_", " ")} · {member.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default AdminCompanyView;
