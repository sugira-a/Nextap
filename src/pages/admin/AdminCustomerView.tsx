import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  UserCircle2, ArrowLeft, Building2, CreditCard,
  Clock, Linkedin, Twitter, Instagram, Link2,
} from "lucide-react";

import { apiRequest } from "@/lib/api";
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
    company?: { id: string; name: string; slug: string } | null;
    card?: { code: string; status: string } | null;
  };
};

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground">{value || "—"}</p>
  </div>
);

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

const AdminCustomerView = () => {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerDetails["customer"] | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const toggleStatus = async () => {
    if (!userId || !data) return;
    const nextStatus = data.user.status === "suspended" ? "active" : "suspended";
    try {
      setStatusUpdating(true);
      await toast.promise(
        apiRequest(`/api/admin/customers/${userId}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ status: nextStatus }),
        }),
        {
          loading: `${nextStatus === "suspended" ? "Suspending" : "Reactivating"} customer…`,
          success: nextStatus === "suspended" ? "Customer suspended successfully" : "Customer reactivated successfully",
          error: (error) => (error instanceof Error ? error.message : "Unable to update status."),
        },
      );
      await load();
    } finally {
      setStatusUpdating(false);
      setStatusDialogOpen(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading customer…</p>;
  if (!data) return <p className="text-sm text-muted-foreground py-8 text-center">Customer not found</p>;

  const fullName = `${data.user.first_name} ${data.user.last_name}`;
  const initials = `${data.user.first_name?.[0] ?? ""}${data.user.last_name?.[0] ?? ""}`.toUpperCase();

  const socialLinks = [
    { label: "LinkedIn", icon: Linkedin, value: data.profile?.linkedin_url, color: "text-blue-600" },
    { label: "Twitter", icon: Twitter, value: data.profile?.twitter_url, color: "text-sky-500" },
    { label: "Instagram", icon: Instagram, value: data.profile?.instagram_url, color: "text-pink-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl space-y-4 px-3 py-2 sm:px-0"
    >

      {/* Top bar — back button on the right */}
      <div className="flex items-center justify-end pt-1">
        <div className="flex items-center gap-2">
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
          <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-muted-foreground hover:text-foreground">
            <Link to="/admin/customers">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to customers
            </Link>
          </Button>
        </div>
      </div>

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {data.user.status === "suspended" ? "Reactivate this customer?" : "Suspend this customer?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {data.user.status === "suspended"
                ? "This will restore the account and mark it active again."
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

      {/* Identity header — dark navy horizontal card */}
      <div className="rounded-xl bg-[#0f172a] px-4 py-3.5 flex items-center gap-3 sm:px-5 sm:py-4">
        {data.profile?.photo_url ? (
          <img
            src={data.profile.photo_url}
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover border border-white/20 shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {initials || <UserCircle2 className="w-5 h-5 text-white/60" />}
          </div>
        )}
        <h1 className="text-base font-semibold text-white">{fullName}</h1>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">

        {/* Profile details */}
        <div className="rounded-xl border border-border/60 bg-background p-4 space-y-3.5 sm:p-5 sm:space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Profile details</p>

          <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:gap-x-6 sm:gap-y-4">
            <Field label="First name" value={data.user.first_name} />
            <Field label="Last name" value={data.user.last_name} />
            <Field label="Title" value={data.profile?.title} />
            <Field label="Location" value={data.profile?.location} />
            <Field label="Phone" value={data.profile?.phone} />
            <Field label="Website" value={data.profile?.website} />
            <Field label="Status" value={data.user.status} />
            <Field label="Public slug" value={`/${data.profile?.public_slug || "—"}`} />
          </div>

          <Separator />

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Bio</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {data.profile?.bio || "No bio provided."}
            </p>
          </div>

          <Separator />

          {/* Social links */}
          <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
            {socialLinks.map(({ label, icon: Icon, value, color }) => (
              <div key={label} className="flex flex-col gap-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${value ? color : "text-muted-foreground"}`} />
                  {label}
                </p>
                <p className={`text-xs break-all ${value ? "text-foreground" : "text-muted-foreground"}`}>
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Summary card */}
          <div className="rounded-xl border border-border/60 bg-background p-4 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Summary</p>
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
                  ? new Date(data.user.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })
                  : "—"}
              </p>
            </SummaryRow>
          </div>

          {/* Public profile card */}
          <div className="rounded-xl border border-border/60 bg-background p-4 space-y-3 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Public profile</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Shareable link used on cards and QR codes.
            </p>
            <div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-violet-400">Profile URL</p>
              <p className="font-mono text-sm text-violet-700 dark:text-violet-300">
                /u/{data.profile?.public_slug || "—"}
              </p>
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Link2 className="w-3 h-3" /> Linked from NFC card and QR
            </p>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default AdminCustomerView;