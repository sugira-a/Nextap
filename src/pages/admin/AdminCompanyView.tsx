import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { apiRequest, apiRequestWithFallback } from "@/lib/api";

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
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-sm text-zinc-400">Company not found</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-8 py-2"
    >
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-4">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-xl object-cover border border-zinc-200" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs text-zinc-400 font-medium">Logo</div>
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-0.5">Admin Â· Companies</p>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{data.company.name}</h1>
            <p className="text-sm text-zinc-400 mt-0.5 font-mono">/{data.company.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${data.company.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{data.company.status}</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 capitalize">{data.company.plan}</span>
          <Link to="/admin/companies" className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">â† Back</Link>
          <button onClick={load} className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">Refresh</button>
          <button onClick={remove} disabled={deleting} className="text-sm border border-red-200 rounded-xl px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
            {deleting ? "Deletingâ€¦" : "Delete"}
          </button>
          <button onClick={save} disabled={saving} className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50">
            {saving ? "Savingâ€¦" : "Save"}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-px bg-zinc-200 rounded-2xl overflow-hidden border border-zinc-200">
        {[
          { label: "Employees", value: data.stats.employee_count },
          { label: "Cards", value: data.stats.card_count },
          { label: "Active Cards", value: data.stats.active_cards },
          { label: "Claimed", value: data.stats.claimed_cards },
          { label: "Invitations", value: data.stats.invitation_count },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.3 }} className="bg-white px-5 py-6">
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Edit form */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
          <p className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Workspace Settings</p>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Company Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Logo URL</label>
            <input value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" placeholder="https://â€¦" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Plan</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors">
                <option value="starter">starter</option>
                <option value="professional">professional</option>
                <option value="enterprise">enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Seats</label>
              <input type="number" min={1} value={form.subscription_seats} onChange={e => setForm(p => ({ ...p, subscription_seats: Number(e.target.value) || 1 }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primary_color} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))} className="h-9 w-12 rounded-lg border border-zinc-200 cursor-pointer" />
                <input value={form.primary_color} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))} className="flex-1 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-zinc-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.accent_color} onChange={e => setForm(p => ({ ...p, accent_color: e.target.value }))} className="h-9 w-12 rounded-lg border border-zinc-200 cursor-pointer" />
                <input value={form.accent_color} onChange={e => setForm(p => ({ ...p, accent_color: e.target.value }))} className="flex-1 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-zinc-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <p className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Details</p>
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-zinc-400 mb-0.5">Created</p><p className="font-medium text-zinc-900">{data.company.created_at ? new Date(data.company.created_at).toLocaleDateString() : "â€”"}</p></div>
            <div><p className="text-xs text-zinc-400 mb-0.5">Slug</p><p className="font-mono text-zinc-900">/{data.company.slug}</p></div>
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-4 rounded-sm border border-zinc-200" style={{ background: form.primary_color }} />
                <span className="text-xs text-zinc-400">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-sm border border-zinc-200" style={{ background: form.accent_color }} />
                <span className="text-xs text-zinc-400">Accent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team members */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-900">Team Members <span className="text-zinc-400 font-normal">({data.members.length})</span></p>
        </div>
        {data.members.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-zinc-400">No members found</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {data.members.map(member => (
              <div key={member.id} className="px-6 py-3.5 hover:bg-zinc-50 transition-colors flex items-center gap-3">
                {member.profile?.photo_url ? (
                  <img src={member.profile.photo_url} alt="" className="h-9 w-9 rounded-full object-cover border border-zinc-200 shrink-0" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                    {member.first_name[0]}{member.last_name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate">{member.first_name} {member.last_name}</p>
                  <p className="text-xs text-zinc-400 truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-500 capitalize">{member.role.replace("_", " ")}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${member.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{member.status}</span>
                </div>
                <Link to={`/admin/users/${member.id}`} className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-lg transition-colors">View</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminCompanyView;