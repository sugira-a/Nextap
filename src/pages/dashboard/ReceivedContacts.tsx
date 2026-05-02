import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MessageCircle, Download, CheckCheck, RefreshCw, FileDown } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

type ReceivedContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  note: string | null;
  is_read: boolean;
  submitted_at: string;
};

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const downloadVCard = (contact: ReceivedContact) => {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${contact.name}`,
    contact.company ? `ORG:${contact.company}` : "",
    contact.phone ? `TEL:${contact.phone}` : "",
    contact.email ? `EMAIL:${contact.email}` : "",
    contact.note ? `NOTE:${contact.note}` : "",
    "END:VCARD",
  ].filter(Boolean).join("\n");
  const blob = new Blob([lines], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${contact.name.replace(/\s+/g, "_")}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("vCard downloaded", { duration: 2000 });
};

const ReceivedContacts = () => {
  const [contacts, setContacts] = useState<ReceivedContact[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await apiRequest<{ contacts: ReceivedContact[]; unread_count: number }>(
        filter === "unread" ? "/api/profile/me/contacts?unread=true" : "/api/profile/me/contacts",
        { headers: { Authorization: `Bearer ${token ?? ""}` } }
      );
      setContacts(res.contacts);
      setUnreadCount(res.unread_count);
    } catch {
      toast.error("Failed to load contacts.", { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id: string) => {
    const token = localStorage.getItem("access_token");
    try {
      await apiRequest(`/api/profile/me/contacts/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, is_read: true } : c)));
      setUnreadCount((n) => Math.max(0, n - 1));
    } catch {
      toast.error("Failed to mark as read.", { duration: 2000 });
    }
  };

  const markAllRead = async () => {
    await Promise.all(contacts.filter((c) => !c.is_read).map((c) => markRead(c.id)));
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Phone", "Email", "Company", "Note", "Date"],
      ...contacts.map((c) => [
        c.name, c.phone || "", c.email || "", c.company || "", c.note || "",
        new Date(c.submitted_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported", { duration: 2000 });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-3xl mx-auto space-y-8 py-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Contacts</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Received</h1>
        </div>
        <div className="flex items-center gap-2">
          {contacts.length > 0 && (
            <button
              onClick={exportCSV}
              title="Export CSV"
              className="w-9 h-9 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center transition-colors"
            >
              <FileDown className="w-4 h-4 text-zinc-500" />
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              title="Mark all read"
              className="w-9 h-9 rounded-xl border border-zinc-900 bg-zinc-900 hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {f === "all" ? `All (${contacts.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-24 border border-zinc-100 rounded-2xl bg-zinc-50">
          <p className="text-zinc-500 font-medium text-sm">
            {filter === "unread" ? "No unread contacts" : "No contacts yet"}
          </p>
          <p className="text-zinc-400 text-xs mt-1 max-w-xs mx-auto">
            {filter === "unread"
              ? "You've read all your contacts."
              : "When someone shares their contact on your card page, it'll appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-all ${
                !contact.is_read ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-zinc-100"
              }`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${avatarColor(contact.name)}`}>
                {contact.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + company */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{contact.name}</p>
                  {!contact.is_read && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">New</span>
                  )}
                </div>
                {contact.company && (
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{contact.company}</p>
                )}
              </div>

              {/* Date */}
              <p className="text-xs text-zinc-400 shrink-0">{formatDate(contact.submitted_at)}</p>

              {/* Download */}
              <button
                onClick={() => downloadVCard(contact)}
                className="shrink-0 w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                title="Download vCard"
              >
                <Download className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ReceivedContacts;
