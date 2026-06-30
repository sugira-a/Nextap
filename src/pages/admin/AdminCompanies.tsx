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
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [adminEmail, setAdminEmail] = useState("");
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
        body: JSON.stringify({ name: name.trim(), slug: toSlug(slug), plan, admin_email: adminEmail.trim() || undefined }),
      });
      toast.success("Company created");
      setName(""); setSlug(""); setPlan("starter"); setAdminEmail("");
      setIssuedCredentials(res.company_admin?.email ? { email: res.company_admin.email, temporaryPassword: res.company_admin.temporary_password } : null);
      setShowForm(false);
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
        <div className="hidden sm:block">
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Admin</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Companies</h1>
          <p className="text-sm text-zinc-400 mt-1">{companies.length} workspaces</p>
        </div>
        <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="search"
            placeholder="Search companies..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 outline-none w-full sm:w-64 focus:border-zinc-500 transition-colors"
          />
          <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }} className="text-sm border border-zinc-200 rounded-xl px-3 py-2.5 outline-none w-full sm:w-auto transition-colors">
            <option value="all">All plans</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="text-sm border border-zinc-200 rounded-xl px-3 py-2.5 outline-none w-full sm:w-auto transition-colors">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={() => setShowForm(f => !f)} className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors w-full sm:w-auto">
            {showForm ? "Cancel" : "Create Company"}
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl p-6 shadow-lg">
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 rounded-md p-1 text-zinc-500 hover:text-zinc-800">✕</button>
            <p className="text-sm font-semibold text-zinc-900 mb-4">New Company</p>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Company Name</label>
                  <input type="text" value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(toSlug(e.target.value)); }} placeholder="Acme Corp" required
                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Slug</label>
                  <input type="text" value={slug} onChange={e => setSlug(toSlug(e.target.value))} placeholder="acme-corp" required
                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Plan</label>
                  <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors">
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Admin Email (optional)</label>
                  <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="owner@acme.com" className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-zinc-200">Cancel</button>
                <button type="submit" disabled={creating} className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50">{creating ? "Creating..." : "Create Company"}</button>
              </div>
            </form>
            {issuedCredentials && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-800 mb-1">Admin Credentials Issued</p>
                <p className="text-xs text-emerald-700">Email: <span className="font-mono font-medium">{issuedCredentials.email}</span></p>
                <p className="text-xs text-emerald-700">Password: <span className="font-mono font-medium">{issuedCredentials.temporaryPassword}</span></p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Companies table / cards view */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all">
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
              {(() => {
                // apply search & filters + pagination on client-side
                const filtered = companies.filter(c => {
                  const q = search.trim().toLowerCase();
                  if (q) {
                    if (!(`${c.name}`.toLowerCase().includes(q) || `${c.slug}`.toLowerCase().includes(q))) return false;
                  }
                  if (filterPlan !== "all" && c.plan !== filterPlan) return false;
                  if (filterStatus !== "all" && c.status !== filterStatus) return false;
                  return true;
                });
                const total = filtered.length;
                const totalPages = Math.max(1, Math.ceil(total / perPage));
                const current = Math.min(page, totalPages);
                const start = (current - 1) * perPage;
                const pageItems = filtered.slice(start, start + perPage);
                return (
                  <>
                    {pageItems.map(company => (
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

                    {/* Pagination controls */}
                    <div className="px-6 py-3 flex items-center justify-between bg-zinc-50">
                      <div className="text-sm text-zinc-500">Showing {start + 1}–{Math.min(start + perPage, total)} of {total} companies</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={current === 1} className="px-3 py-1 rounded-md border border-zinc-200 text-sm disabled:opacity-50">Prev</button>
                        <div className="text-sm text-zinc-600">{current} / {totalPages}</div>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={current === totalPages} className="px-3 py-1 rounded-md border border-zinc-200 text-sm disabled:opacity-50">Next</button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-100">
              {(() => {
                // mobile filtered + paginated
                const filtered = companies.filter(c => {
                  const q = search.trim().toLowerCase();
                  if (q) {
                    if (!(`${c.name}`.toLowerCase().includes(q) || `${c.slug}`.toLowerCase().includes(q))) return false;
                  }
                  if (filterPlan !== "all" && c.plan !== filterPlan) return false;
                  if (filterStatus !== "all" && c.status !== filterStatus) return false;
                  return true;
                });
                const total = filtered.length;
                const totalPages = Math.max(1, Math.ceil(total / perPage));
                const current = Math.min(page, totalPages);
                const start = (current - 1) * perPage;
                const pageItems = filtered.slice(start, start + perPage);
                return (
                  <>
                    {pageItems.map(company => (
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
                    <div className="px-4 py-3 flex items-center justify-between">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-md border border-zinc-200 text-sm disabled:opacity-50">Prev</button>
                      <div className="text-sm text-zinc-600">{page}</div>
                      <button onClick={() => setPage(p => p + 1)} disabled={page * perPage >= filtered.length} className="px-3 py-1 rounded-md border border-zinc-200 text-sm disabled:opacity-50">Next</button>
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdminCompanies;