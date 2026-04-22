import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { apiRequest, apiRequestWithFallback } from "@/lib/api";

type UserDetails = {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
    created_at?: string;
  };
  profile: {
    public_slug: string;
    title?: string | null;
    bio?: string | null;
    phone?: string | null;
    website?: string | null;
    location?: string | null;
    photo_url?: string | null;
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

type CustomerDetailsResponse = {
  customer: UserDetails;
};

type UserListResponse = {
  users: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
    created_at?: string;
    company?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
};

const AdminUserView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [data, setData] = useState<UserDetails | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    status: "active",
    public_slug: "",
    title: "",
    bio: "",
    phone: "",
    website: "",
    location: "",
    photo_url: "",
    linkedin_url: "",
    twitter_url: "",
    instagram_url: "",
  });

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await apiRequestWithFallback<UserDetails>([
        () =>
          apiRequest<UserDetails>(`/api/admin/users/${userId}`, {
            headers: authHeaders,
          }),
        async () => {
          const customerResponse = await apiRequest<CustomerDetailsResponse>(`/api/admin/customers/${userId}`, {
            headers: authHeaders,
          });
          return customerResponse.customer;
        },
        async () => {
          const listResponse = await apiRequest<UserListResponse>("/api/admin/users?per_page=500", {
            headers: authHeaders,
          });
          const user = listResponse.users.find((candidate) => candidate.id === userId);
          if (!user) {
            throw new Error("User not found");
          }

          return {
            user,
            profile: null,
            company: user.company || null,
            card: null,
          };
        },
      ]);

      setData(response);
      setForm({
        first_name: response.user.first_name || "",
        last_name: response.user.last_name || "",
        status: response.user.status || "active",
        public_slug: response.profile?.public_slug || "",
        title: response.profile?.title || "",
        bio: response.profile?.bio || "",
        phone: response.profile?.phone || "",
        website: response.profile?.website || "",
        location: response.profile?.location || "",
        photo_url: response.profile?.photo_url || "",
        linkedin_url: response.profile?.linkedin_url || "",
        twitter_url: response.profile?.twitter_url || "",
        instagram_url: response.profile?.instagram_url || "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const save = async () => {
    if (!userId) return;

    if (!form.first_name.trim() || !form.last_name.trim() || !form.public_slug.trim()) {
      toast.error("First name, last name, and public slug are required");
      return;
    }

    try {
      setSaving(true);
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          status: form.status,
          public_slug: form.public_slug.trim(),
          title: form.title.trim() || null,
          bio: form.bio.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          location: form.location.trim() || null,
          photo_url: form.photo_url.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          twitter_url: form.twitter_url.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
        }),
      });

      toast.success("User updated");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!userId || !data) return;

    const confirmed = window.confirm(`Delete user ${data.user.email}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeleting(true);
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      toast.success("User deleted");
      navigate("/admin/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
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
    return <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-sm text-zinc-400">User not found</div>;
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
          {form.photo_url ? (
            <img src={form.photo_url} alt="Profile" className="h-14 w-14 rounded-full object-cover border border-zinc-200" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-400">
              {data.user.first_name[0]}{data.user.last_name[0]}
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-0.5">Admin Â· Users</p>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{data.user.first_name} {data.user.last_name}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{data.user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${data.user.status === "active" ? "bg-emerald-50 text-emerald-700" : data.user.status === "suspended" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-500"}`}>{data.user.status}</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 capitalize">{data.user.role}</span>
          <Link to="/admin/users" className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">â† Back</Link>
          <button onClick={load} className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">Refresh</button>
          <button onClick={remove} disabled={deleting} className="text-sm border border-red-200 rounded-xl px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button onClick={save} disabled={saving} className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Edit form */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
          <p className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Account & Profile</p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">First Name</label>
              <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Last Name</label>
              <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Public Slug</label>
              <input value={form.public_slug} onChange={e => setForm(p => ({ ...p, public_slug: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-zinc-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Photo URL</label>
            <input value={form.photo_url} onChange={e => setForm(p => ({ ...p, photo_url: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" placeholder="https://..." />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Phone</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Location</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Website</label>
            <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" placeholder="https://..." />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[["LinkedIn", "linkedin_url"], ["Twitter", "twitter_url"], ["Instagram", "instagram_url"]].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs text-zinc-400 mb-1.5 block">{label}</label>
                <input value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
          <p className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Account Context</p>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Company</p>
              <p className="font-medium text-zinc-900">{data.company?.name || "Not assigned"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Card</p>
              <p className="font-medium text-zinc-900 font-mono">{data.card?.code || "No card"}</p>
              <p className="text-xs text-zinc-400 capitalize">{data.card?.status || ""”"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Joined</p>
              <p className="font-medium text-zinc-900">{data.user.created_at ? new Date(data.user.created_at).toLocaleDateString() : ""”"}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminUserView;