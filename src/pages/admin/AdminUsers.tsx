import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

type AdminUser = {
  id: string; first_name: string; last_name: string; email: string;
  role: string; status: string; company_id?: string | null;
  company?: { id: string; name: string; slug: string } | null;
};
type AdminCompany = { id: string; name: string };

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteCompanyId, setInviteCompanyId] = useState("");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ per_page: "200", ...(filter !== "all" && { status: filter }) });
      const res = await apiRequest<{ users: AdminUser[] }>(`/api/admin/users?${params}`, { headers: authHeaders });
      setUsers(res.users || []);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    apiRequest<{ companies: AdminCompany[] }>("/api/admin/companies?per_page=200", { headers: authHeaders })
      .then(r => { setCompanies(r.companies || []); setInviteCompanyId(c => c || r.companies?.[0]?.id || ""); })
      .catch(() => {});
    fetchUsers();
  }, [filter]);

  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase();
    return `${u.first_name} ${u.last_name}`.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  const exportUsers = () => {
    const rows = [["first_name", "last_name", "email", "role", "status", "company"], ...filteredUsers.map(u => [u.first_name, u.last_name, u.email, u.role, u.status, u.company?.name || ""])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "admin-users.csv" });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("Exported");
  };

  const inviteUser = async () => {
    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) { toast.error("Name and email required"); return; }
    try {
      setInviting(true);
      const res = await apiRequest<{ user: AdminUser }>("/api/admin/users/invite", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: inviteFirstName.trim(), last_name: inviteLastName.trim(), email: inviteEmail.trim(), role: inviteRole, company_id: inviteCompanyId || undefined }),
      });
      toast.success(`Invited ${res.user.email}`);
      setShowInvite(false); setInviteFirstName(""); setInviteLastName(""); setInviteEmail(""); setInviteRole("employee");
      fetchUsers();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to invite"); }
    finally { setInviting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-8 py-2"
    >
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Admin</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Users</h1>
          <p className="text-sm text-zinc-400 mt-1">{users.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportUsers} className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">Export CSV</button>
          <button onClick={() => setShowInvite(f => !f)} className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors">
            {showInvite ? "Cancel" : "Invite User"}
          </button>
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <p className="text-sm font-semibold text-zinc-900">Invite User</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">First Name</label>
              <input value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Last Name</label>
              <input value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Email</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors">
                <option value="employee">Employee</option>
                <option value="company_admin">Company Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Company</label>
              <select value={inviteCompanyId} onChange={e => setInviteCompanyId(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors">
                <option value="">No company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={inviteUser} disabled={inviting} className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50">
            {inviting ? "Invitingâ€¦" : "Invite"}
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search usersâ€¦"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
        />
        <div className="flex gap-1.5 bg-zinc-100 rounded-lg p-1">
          {["all", "active", "inactive", "suspended"].map(v => (
            <button key={v} onClick={() => setFilter(v)} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors capitalize ${filter === v ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-zinc-400">No users found</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            <div className="grid grid-cols-12 px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="col-span-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">User</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Role</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Company</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Action</span>
            </div>
            {filteredUsers.map(user => (
              <div key={user.id} className="grid grid-cols-12 px-6 py-3.5 hover:bg-zinc-50 transition-colors items-center">
                <div className="col-span-4">
                  <p className="text-sm font-medium text-zinc-900">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </div>
                <div className="col-span-2 text-sm text-zinc-500 capitalize">{user.role?.replace("_", " ")}</div>
                <div className="col-span-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                    user.status === "active" ? "bg-emerald-50 text-emerald-700" :
                    user.status === "suspended" ? "bg-red-50 text-red-600" :
                    "bg-zinc-100 text-zinc-500"
                  }`}>{user.status}</span>
                </div>
                <div className="col-span-2 text-xs text-zinc-400">{user.company?.name || "â€”"}</div>
                <div className="col-span-2 text-right">
                  <Link to={`/admin/users/${user.id}`} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors">View â†’</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminUsers;