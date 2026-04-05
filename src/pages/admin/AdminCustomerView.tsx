import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, RefreshCw, UserCircle2, ShieldCheck, Link2, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type CustomerDetails = {
  customer: {
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
};

const AdminCustomerView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CustomerDetails["customer"] | null>(null);
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
      const response = await apiRequest<CustomerDetails>(`/api/admin/customers/${userId}`, {
        headers: authHeaders,
      });

      setData(response.customer);
      setForm({
        first_name: response.customer.user.first_name || "",
        last_name: response.customer.user.last_name || "",
        status: response.customer.user.status || "active",
        public_slug: response.customer.profile?.public_slug || "",
        title: response.customer.profile?.title || "",
        bio: response.customer.profile?.bio || "",
        phone: response.customer.profile?.phone || "",
        website: response.customer.profile?.website || "",
        location: response.customer.profile?.location || "",
        photo_url: response.customer.profile?.photo_url || "",
        linkedin_url: response.customer.profile?.linkedin_url || "",
        twitter_url: response.customer.profile?.twitter_url || "",
        instagram_url: response.customer.profile?.instagram_url || "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load customer");
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
      await apiRequest(`/api/admin/customers/${userId}`, {
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

      toast.success("Customer profile updated");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-muted-foreground">Loading customer...</Card>;
  }

  if (!data) {
    return <Card className="p-8 text-center text-muted-foreground">Customer not found</Card>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/customers">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Customers
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Saving..." : "Save Changes"}
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
          <div className="space-y-2 min-w-0">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {data.user.first_name} {data.user.last_name}
              </h1>
              <p className="text-sm text-muted-foreground truncate">{data.user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs items-center">
              <Badge className="capitalize">{data.user.role}</Badge>
              <Badge variant="secondary" className="capitalize">{data.user.status}</Badge>
              <span className="text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> /{data.profile?.public_slug || "-"}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Customer Profile</h2>
            <p className="text-sm text-muted-foreground">Keep this information polished and consistent across the public profile.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">First Name</label>
              <Input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Last Name</label>
              <Input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Public Slug</label>
              <Input value={form.public_slug} onChange={(e) => setForm((p) => ({ ...p, public_slug: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Profile Photo URL</label>
            <Input value={form.photo_url} onChange={(e) => setForm((p) => ({ ...p, photo_url: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Website</label>
            <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">LinkedIn</label>
              <Input value={form.linkedin_url} onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Twitter</label>
              <Input value={form.twitter_url} onChange={(e) => setForm((p) => ({ ...p, twitter_url: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Instagram</label>
              <Input value={form.instagram_url} onChange={(e) => setForm((p) => ({ ...p, instagram_url: e.target.value }))} />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">Summary</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-muted-foreground" />{data.company?.name || "Not assigned"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Card</p>
                <p className="font-medium">{data.card?.code || "No card"}</p>
                <p className="text-xs text-muted-foreground capitalize">{data.card?.status || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{data.user.created_at ? new Date(data.user.created_at).toLocaleString() : "-"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">Public Profile</h2>
            <p className="text-sm text-muted-foreground">This is the public-facing profile linked from the card.</p>
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Profile Link</div>
              <div className="font-mono text-sm text-foreground break-all">/u/{data.profile?.public_slug || "-"}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Link2 className="w-3.5 h-3.5" /> Clean public route for sharing and QR/NFC.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminCustomerView;