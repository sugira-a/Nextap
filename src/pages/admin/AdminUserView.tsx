import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Trash2, RefreshCw, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

import { apiRequest, apiRequestWithFallback } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
    return <Card className="p-8 text-center text-muted-foreground">Loading user...</Card>;
  }

  if (!data) {
    return <Card className="p-8 text-center text-muted-foreground">User not found</Card>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/users">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Users
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
          {form.photo_url ? (
            <img src={form.photo_url} alt="Profile" className="h-16 w-16 rounded-full object-cover border border-border" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border border-border">
              <UserCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold text-foreground">{data.user.first_name} {data.user.last_name}</h1>
            <p className="text-sm text-muted-foreground">{data.user.email}</p>
            <div className="flex items-center gap-2 text-xs">
              <Badge className="capitalize">{data.user.role}</Badge>
              <Badge variant="secondary" className="capitalize">{data.user.status}</Badge>
              <span className="text-muted-foreground">/{data.profile?.public_slug || "-"}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2 space-y-4">
          <h2 className="font-heading font-semibold">Account & Profile</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="First Name" />
            <Input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Last Name" />
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="suspended">suspended</option>
            </select>
            <Input value={form.public_slug} onChange={(e) => setForm((p) => ({ ...p, public_slug: e.target.value }))} placeholder="Public Slug" />
          </div>

          <Input value={form.photo_url} onChange={(e) => setForm((p) => ({ ...p, photo_url: e.target.value }))} placeholder="Photo URL" />
          <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" />
          <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Bio" />

          <div className="grid sm:grid-cols-2 gap-3">
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
            <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location" />
          </div>
          <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="Website" />

          <div className="grid sm:grid-cols-3 gap-3">
            <Input value={form.linkedin_url} onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))} placeholder="LinkedIn URL" />
            <Input value={form.twitter_url} onChange={(e) => setForm((p) => ({ ...p, twitter_url: e.target.value }))} placeholder="Twitter URL" />
            <Input value={form.instagram_url} onChange={(e) => setForm((p) => ({ ...p, instagram_url: e.target.value }))} placeholder="Instagram URL" />
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-heading font-semibold">Account Context</h2>
          <div className="text-sm">
            <p className="text-muted-foreground">Company</p>
            <p className="font-medium">{data.company?.name || "Not assigned"}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Card</p>
            <p className="font-medium">{data.card?.code || "No card"}</p>
            <p className="text-xs text-muted-foreground capitalize">{data.card?.status || "-"}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Joined</p>
            <p className="font-medium">{data.user.created_at ? new Date(data.user.created_at).toLocaleString() : "-"}</p>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdminUserView;
