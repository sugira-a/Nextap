import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";

type Customer = {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
  };
  profile: {
    public_slug: string;
    title?: string | null;
    bio?: string | null;
    phone?: string | null;
    website?: string | null;
    location?: string | null;
    linkedin_url?: string | null;
    twitter_url?: string | null;
    instagram_url?: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  card?: {
    code: string;
    status: string;
  } | null;
};

type CustomerResponse = {
  customers: Customer[];
  total: number;
};

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const authHeaders = (() => { const token = localStorage.getItem("access_token"); return token ? { Authorization: `Bearer ${token}` } : {}; })();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        per_page: "200",
        ...(status !== "all" && { status }),
        ...(search.trim() && { search: search.trim() }),
      });

      const response = await apiRequest<CustomerResponse>(`/api/admin/customers?${params}`, {
        headers: authHeaders,
      });

      setCustomers(response.customers || []);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [status]);

  const filtered = customers.filter((customer) => {
    if (!search.trim()) {
      return true;
    }
    const q = search.toLowerCase();
    return (
      `${customer.user.first_name} ${customer.user.last_name}`.toLowerCase().includes(q) ||
      customer.user.email.toLowerCase().includes(q) ||
      (customer.profile?.public_slug || "").toLowerCase().includes(q)
    );
  });

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
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Customers</h1>
          <p className="text-sm text-zinc-400 mt-1">{total} customer accounts</p>
        </div>
        <button onClick={fetchCustomers} className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors shrink-0">Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          type="text"
          placeholder="Search customers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchCustomers()}
          className="flex-1 min-w-48 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
        />
        <div className="flex gap-1.5 bg-zinc-100 rounded-lg p-1 overflow-x-auto sm:overflow-visible flex-wrap sm:flex-nowrap">
          {["all", "active", "inactive", "suspended"].map(v => (
            <button key={v} onClick={() => setStatus(v)} className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors capitalize shrink-0 ${status === v ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Table / Cards View */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-zinc-400">No customers found</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block divide-y divide-zinc-100">
              <div className="grid grid-cols-12 px-6 py-3 bg-zinc-50 border-b border-zinc-100">
                <span className="col-span-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Customer</span>
                <span className="col-span-3 text-xs font-medium text-zinc-400 uppercase tracking-wide hidden md:block">Profile</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide hidden lg:block">Company</span>
                <span className="col-span-1 text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Action</span>
              </div>
              {filtered.map(customer => (
                <div key={customer.user.id} className="grid grid-cols-12 px-6 py-3.5 hover:bg-zinc-50 transition-colors items-center">
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{customer.user.first_name} {customer.user.last_name}</p>
                    <p className="text-xs text-zinc-400 truncate">{customer.user.email}</p>
                  </div>
                  <div className="col-span-3 hidden md:block min-w-0">
                    <p className="text-xs text-zinc-700 font-mono">/{customer.profile?.public_slug || "—"}</p>
                    <p className="text-xs text-zinc-400 truncate">{customer.profile?.title || customer.profile?.location || "—"}</p>
                  </div>
                  <div className="col-span-2 hidden lg:block text-xs text-zinc-400">{customer.company?.name || "—"}</div>
                  <div className="col-span-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${customer.user.status === "active" ? "bg-emerald-50 text-emerald-700" : customer.user.status === "suspended" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-500"}`}>{customer.user.status}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <button onClick={() => navigate(`/admin/customers/${customer.user.id}`)} className="text-xs text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors">Edit Profile</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-100">
              {filtered.map(customer => (
                <div key={customer.user.id} className="p-4 hover:bg-zinc-50 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{customer.user.first_name} {customer.user.last_name}</p>
                      <p className="text-xs text-zinc-400 truncate">{customer.user.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${customer.user.status === "active" ? "bg-emerald-50 text-emerald-700" : customer.user.status === "suspended" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-500"}`}>{customer.user.status}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {customer.profile && (
                      <div className="bg-zinc-50 rounded-lg p-2.5">
                        <p className="text-zinc-700 font-mono">/{customer.profile.public_slug || "—"}</p>
                        <p className="text-zinc-400">{customer.profile.title || customer.profile.location || "—"}</p>
                      </div>
                    )}
                    {customer.company && (
                      <p className="text-zinc-400">Company: <span className="text-zinc-700">{customer.company.name}</span></p>
                    )}
                  </div>
                  <button onClick={() => navigate(`/admin/customers/${customer.user.id}`)} className="w-full text-xs text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-3 py-2 rounded-lg transition-colors">
                    Edit Profile
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdminCustomers;
