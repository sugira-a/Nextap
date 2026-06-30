import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  UserCircle2, ArrowLeft, Building2, CreditCard, Clock, Linkedin, Twitter, Instagram,
} from "lucide-react";

import { apiRequest, apiRequestWithFallback } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  company?: { id: string; name: string; slug: string } | null;
  card?: { code: string; status: string } | null;
};

type CustomerDetailsResponse = { customer: UserDetails };
type UserListResponse = {
  users: Array<{
    id: string; first_name: string; last_name: string; email: string;
    role: string; status: string; created_at?: string;
    company?: { id: string; name: string; slug: string } | null;
  }>;
};

const inputClass =
  "w-full border border-border/60 rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/50";

const labelClass = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5 block";

const SummaryRow = ({
  icon: Icon,
  label,
  iconColor,
  children,
}: {
  icon: React.ElementType;
  label: string;
  iconColor?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
    <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <span className={`flex items-center justify-center w-6 h-6 rounded-md ${iconColor ?? "bg-muted text-muted-foreground"}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      {label}
    </span>
    <div className="text-right">{children}</div>
  </div>
);

const AdminUserView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [data, setData] = useState<UserDetails | null>(null);
  const [form, setForm] = useState({
    first_name: "", last_name: "", status: "active", public_slug: "",
    title: "", bio: "", phone: "", website: "", location: "", photo_url: "",
    linkedin_url: "", twitter_url: "", instagram_url: "",
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
        () => apiRequest<UserDetails>(`/api/admin/users/${userId}`, { headers: authHeaders }),
        async () => {
          const r = await apiRequest<CustomerDetailsResponse>(`/api/admin/customers/${userId}`, { headers: authHeaders });
          return r.customer;
        },
        async () => {
          const r = await apiRequest<UserListResponse>("/api/admin/users?per_page=500", { headers: authHeaders });
          const user = r.users.find((u) => u.id === userId);
          if (!user) throw new Error("User not found");
          return { user, profile: null, company: user.company || null, card: null };
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

  useEffect(() => { load(); }, [userId]);

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
      await apiRequest(`/api/admin/users/${userId}`, { method: "DELETE", headers: authHeaders });
      toast.success("User deleted");
      navigate("/admin/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async () => {
    if (!userId || !data) return;
    const nextStatus = data.user.status === "suspended" ? "active" : "suspended";
    try {
      setStatusUpdating(true);
      await toast.promise(
        apiRequest(`/api/admin/users/${userId}/status`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ status: nextStatus }),
        }),
        {
          loading: `${nextStatus === "suspended" ? "Suspending" : "Reactivating"} user…`,
          success: nextStatus === "suspended" ? "User suspended successfully" : "User reactivated successfully",
          error: (error) => (error instanceof Error ? error.message : "Unable to update status."),
        },
      );
      await load();
    } finally {
      setStatusUpdating(false);
      setStatusDialogOpen(false);
    }
  };

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
    </div>
  );

  if (!data) return <p className="text-sm text-muted-foreground py-8 text-center">User not found</p>;

  const initials = `${data.user.first_name?.[0] ?? ""}${data.user.last_name?.[0] ?? ""}`.toUpperCase();
  const fullName = `${data.user.first_name} ${data.user.last_name}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-4 px-3 py-2 sm:px-0"
    >
      {/* Top bar — back on right, actions on right */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <Link to="/admin/users">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to users
          </Link>
        </Button>
      </div>

      {/* Identity header — dark navy card */}
      <div className="rounded-xl bg-[#0f172a] px-4 py-3.5 flex items-center justify-between gap-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          {form.photo_url ? (
            <img src={form.photo_url} alt="Profile" className="h-10 w-10 rounded-full object-cover border border-white/20 shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {initials || <UserCircle2 className="w-5 h-5 text-white/60" />}
            </div>
          )}
          <h1 className="text-base font-semibold text-white">{fullName}</h1>
        </div>

        {/* Action buttons inside header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setStatusDialogOpen(true)}
            disabled={statusUpdating}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
              data.user.status === "suspended"
                ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                : "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            }`}
          >
            {statusUpdating ? "Updating…" : data.user.status === "suspended" ? "Reactivate" : "Suspend"}
          </button>
          <button
            onClick={remove}
            disabled={deleting}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="text-xs font-medium px-4 py-1.5 rounded-lg bg-white text-[#0f172a] hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {data.user.status === "suspended" ? "Reactivate this user?" : "Suspend this user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {data.user.status === "suspended"
                ? "This will restore access for the user and mark the account active again."
                : "This will restrict the account until it is manually reactivated."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void toggleStatus();
              }}
              className={data.user.status === "suspended" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}
              disabled={statusUpdating}
            >
              {data.user.status === "suspended" ? "Reactivate" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main grid */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">

        {/* Edit form */}
        <div className="rounded-xl border border-border/60 bg-background p-4 space-y-3.5 sm:p-5 sm:space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Account & profile</p>

          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <label className={labelClass}>First name</label>
              <input value={form.first_name} onChange={field("first_name")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input value={form.last_name} onChange={field("last_name")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={field("status")} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Public slug</label>
              <input value={form.public_slug} onChange={field("public_slug")} className={`${inputClass} font-mono`} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Photo URL</label>
            <input value={form.photo_url} onChange={field("photo_url")} className={inputClass} placeholder="https://..." />
          </div>

          <div>
            <label className={labelClass}>Title</label>
            <input value={form.title} onChange={field("title")} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Bio</label>
            <textarea value={form.bio} onChange={field("bio")} rows={3} className={`${inputClass} resize-none`} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <label className={labelClass}>Phone</label>
              <input value={form.phone} onChange={field("phone")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input value={form.location} onChange={field("location")} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Website</label>
            <input value={form.website} onChange={field("website")} className={inputClass} placeholder="https://..." />
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {([
              { label: "LinkedIn", icon: Linkedin, key: "linkedin_url", color: "text-blue-500" },
              { label: "Twitter", icon: Twitter, key: "twitter_url", color: "text-sky-500" },
              { label: "Instagram", icon: Instagram, key: "instagram_url", color: "text-pink-500" },
            ] as const).map(({ label, icon: Icon, key, color }) => (
              <div key={key}>
                <label className={`${labelClass} flex items-center gap-1.5`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
                </label>
                <input value={form[key]} onChange={field(key)} className={inputClass} />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-background p-4 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Account context</p>
            <SummaryRow icon={Building2} label="Company" iconColor="bg-blue-50 text-blue-500">
              <p className="text-sm text-foreground">{data.company?.name || "Not assigned"}</p>
            </SummaryRow>
            <SummaryRow icon={CreditCard} label="Card" iconColor="bg-emerald-50 text-emerald-500">
              <p className="text-sm font-mono text-foreground">{data.card?.code || "—"}</p>
              {data.card?.status && (
                <p className="text-[11px] capitalize text-emerald-500">{data.card.status}</p>
              )}
            </SummaryRow>
            <SummaryRow icon={Clock} label="Joined" iconColor="bg-amber-50 text-amber-500">
              <p className="text-sm text-foreground">
                {data.user.created_at
                  ? new Date(data.user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </p>
            </SummaryRow>
          </div>

          {/* Status indicator card */}
          <div className="rounded-xl border border-border/60 bg-background p-4 space-y-3 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Current status</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize
                ${data.user.status === "active" ? "bg-emerald-50 text-emerald-600" :
                  data.user.status === "suspended" ? "bg-red-50 text-red-500" :
                  "bg-muted text-muted-foreground"}`}>
                <span className={`w-1.5 h-1.5 rounded-full
                  ${data.user.status === "active" ? "bg-emerald-500" :
                    data.user.status === "suspended" ? "bg-red-400" : "bg-muted-foreground"}`}
                />
                {data.user.status}
              </span>
              <span className="inline-flex text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                {data.user.role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{data.user.email}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminUserView;