import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

type Company = {
  id: string; name: string; slug: string; plan: string; status: string;
  subscription_seats: number; primary_color: string; accent_color: string; created_at: string;
  stats?: { employee_count: number; card_count: number; invitation_count: number };
};

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const AdminCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [adminFirstName, setAdminFirstName] = useState("Company");
  const [adminLastName, setAdminLastName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [issuedCredentials, setIssuedCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ companies: Company[] }>("/api/admin/companies", { headers: authHeaders });
      setCompanies(data.companies || []);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load companies"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) { toast.error("Name and slug are required"); return; }
    try {
      setCreating(true);
      const res = await apiRequest<{ message: string; company_admin?: { email: string; temporary_password: string } }>("/api/company/create", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: toSlug(slug), plan, admin_first_name: adminFirstName.trim(), admin_last_name: adminLastName.trim(), admin_email: adminEmail.trim() || undefined, admin_password: adminPassword || undefined }),
      });
      toast.success("Company created");
      setName(""); setSlug(""); setPlan("starter"); setAdminEmail(""); setAdminPassword("");
      setIssuedCredentials(res.company_admin?.email ? { email: res.company_admin.email, temporaryPassword: res.company_admin.temporary_password } : null);
      await fetchCompanies();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to create company"); }
    finally { setCreating(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-8 py-2"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-zinc-200 pb-6 gap-4 sm:gap-0">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Admin</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Companies</h1>
          <p className="text-sm text-zinc-400 mt-1">{companies.length} workspaces</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors shrink-0">
          {showForm ? "Cancel" : "Create Company"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-5">New Company</p>
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Company Name</label>
                <input type="text" value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(toSlug(e.target.value)); }} placeholder="Acme Corp" required
                  className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Slug</label>
                <input type="text" value={slug} onChange={e => setSlug(toSlug(e.target.value))} placeholder="acme-corp" required
                  className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Plan</label>
                <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors">
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Admin First Name</label>
                <input type="text" value={adminFirstName} onChange={e => setAdminFirstName(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Admin Last Name</label>
                <input type="text" value={adminLastName} onChange={e => setAdminLastName(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Admin Email (optional)</label>
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="owner@acme.com" className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Admin Password (optional)</label>
                <input type="text" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Auto-generate if blank" className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={creating} className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50 w-full sm:w-auto">
              {creating ? "Creating..." : "Create Company"}
            </button>
          </form>
          {issuedCredentials && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800 mb-1">Admin Credentials Issued</p>
              <p className="text-xs text-emerald-700">Email: <span className="font-mono font-medium">{issuedCredentials.email}</span></p>
              <p className="text-xs text-emerald-700">Password: <span className="font-mono font-medium">{issuedCredentials.temporaryPassword}</span></p>
            </div>
          )}
        </motion.div>
      )}

      {/* Companies table / cards view */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          </div>
        ) : companies.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-zinc-400">No companies yet</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block divide-y divide-zinc-100">
              <div className="grid grid-cols-12 px-6 py-3 bg-zinc-50 border-b border-zinc-100">
                <span className="col-span-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Company</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Plan</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Seats</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Stats</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Action</span>
              </div>
              {companies.map(company => (
                <div key={company.id} className="grid grid-cols-12 px-6 py-3.5 hover:bg-zinc-50 transition-colors items-center">
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-zinc-900">{company.name}</p>
                    <p className="text-xs text-zinc-400">/{company.slug}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 capitalize">{company.plan}</span>
                  </div>
                  <div className="col-span-2 text-sm text-zinc-600">{company.subscription_seats}</div>
                  <div className="col-span-2 text-xs text-zinc-400">
                    {company.stats?.employee_count ?? 0} users · {company.stats?.card_count ?? 0} cards
                  </div>
                  <div className="col-span-2 text-right">
                    <Link to={`/admin/companies/${company.id}`} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-100">
              {companies.map(company => (
                <Link key={company.id} to={`/admin/companies/${company.id}`} className="block p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900">{company.name}</p>
                      <p className="text-xs text-zinc-400">/{company.slug}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 capitalize shrink-0">{company.plan}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-zinc-50 rounded-lg p-2.5 text-center">
                      <p className="font-semibold text-zinc-900">{company.subscription_seats}</p>
                      <p className="text-zinc-400 text-[10px]">Seats</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-2.5 text-center">
                      <p className="font-semibold text-zinc-900">{company.stats?.employee_count ?? 0}</p>
                      <p className="text-zinc-400 text-[10px]">Users</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-2.5 text-center">
                      <p className="font-semibold text-zinc-900">{company.stats?.card_count ?? 0}</p>
                      <p className="text-zinc-400 text-[10px]">Cards</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdminCompanies;