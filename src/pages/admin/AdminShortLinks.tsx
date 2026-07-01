import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import {
  Link2, Plus, Copy, ExternalLink, Trash2, Pencil, Check,
  Search, QrCode, ToggleLeft, ToggleRight, X, MousePointerClick,
  Clock, RefreshCw,
} from "lucide-react";

type ShortLink = {
  id: string;
  alias: string;
  original_url: string;
  title: string | null;
  is_active: boolean;
  click_count: number;
  last_visited_at: string | null;
  created_at: string;
};

type FormState = { original_url: string; alias: string; title: string };
const EMPTY_FORM: FormState = { original_url: "", alias: "", title: "" };

const BASE_URL = window.location.origin;

const shortUrl = (alias: string) => `${BASE_URL}/s/${alias}`;

const timeAgo = (iso: string | null): string => {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// ── QR modal ─────────────────────────────────────────────────────────────────
const QrModal = ({ url, onClose }: { url: string; onClose: () => void }) => {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(url)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <p className="font-semibold text-sm text-zinc-800">QR Code</p>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X className="w-4 h-4" /></button>
        </div>
        <img src={qrSrc} alt="QR Code" className="rounded-xl border border-zinc-100" width={220} height={220} />
        <p className="text-xs text-zinc-500 text-center break-all">{url}</p>
        <a
          href={qrSrc}
          download="qr-code.png"
          className="w-full text-center py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
        >
          Download PNG
        </a>
      </motion.div>
    </div>
  );
};

// ── Link row ──────────────────────────────────────────────────────────────────
const LinkRow = ({
  link,
  onDelete,
  onToggle,
  onEdit,
  onQr,
}: {
  link: ShortLink;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (link: ShortLink) => void;
  onQr: (url: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const short = shortUrl(link.alias);

  const copy = () => {
    navigator.clipboard.writeText(short);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors ${
        link.is_active ? "bg-white border-zinc-200 hover:border-zinc-300" : "bg-zinc-50 border-zinc-200 opacity-60"
      }`}
    >
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
        <Link2 className="w-4 h-4 text-indigo-500" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {link.title && (
          <p className="text-xs font-semibold text-zinc-800 truncate">{link.title}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-indigo-600 truncate">{short}</span>
        </div>
        <p className="text-xs text-zinc-400 truncate max-w-xs">{link.original_url}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 shrink-0 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <MousePointerClick className="w-3.5 h-3.5" />
          {link.click_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 hidden sm:flex">
          <Clock className="w-3.5 h-3.5" />
          {timeAgo(link.last_visited_at)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={copy} title="Copy link" className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <a href={short} target="_blank" rel="noreferrer" title="Open link" className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={() => onQr(short)} title="QR Code" className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
          <QrCode className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onEdit(link)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onToggle(link.id, !link.is_active)}
          title={link.is_active ? "Disable" : "Enable"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors"
        >
          {link.is_active
            ? <ToggleRight className="w-4 h-4 text-emerald-500" />
            : <ToggleLeft className="w-4 h-4" />}
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "/${link.alias}"? This cannot be undone.`)) onDelete(link.id);
          }}
          title="Delete"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const AdminShortLinks = () => {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ links: ShortLink[] }>("/api/shortlinks", { headers: authHeaders });
      setLinks(res.links || []);
    } catch {
      toast.error("Failed to load short links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (showForm) setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [showForm]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (link: ShortLink) => {
    setForm({ original_url: link.original_url, alias: link.alias, title: link.title || "" });
    setEditingId(link.id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.original_url.trim()) { toast.error("Destination URL is required"); return; }
    setSaving(true);
    try {
      if (editingId) {
        const res = await apiRequest<{ link: ShortLink }>(`/api/shortlinks/${editingId}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(form),
        });
        setLinks((prev) => prev.map((l) => (l.id === editingId ? res.link : l)));
        toast.success("Link updated");
      } else {
        const res = await apiRequest<{ link: ShortLink }>("/api/shortlinks", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(form),
        });
        setLinks((prev) => [res.link, ...prev]);
        toast.success(`Short link created: /s/${res.link.alias}`);
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save link");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = links;
    setLinks((l) => l.filter((x) => x.id !== id));
    try {
      await apiRequest(`/api/shortlinks/${id}`, { method: "DELETE", headers: authHeaders });
      toast.success("Link deleted");
    } catch {
      setLinks(prev);
      toast.error("Failed to delete link");
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    setLinks((l) => l.map((x) => (x.id === id ? { ...x, is_active: active } : x)));
    try {
      await apiRequest(`/api/shortlinks/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ is_active: active }),
      });
    } catch {
      setLinks((l) => l.map((x) => (x.id === id ? { ...x, is_active: !active } : x)));
      toast.error("Failed to update link");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return links.filter(
      (l) =>
        !q ||
        l.alias.toLowerCase().includes(q) ||
        l.original_url.toLowerCase().includes(q) ||
        (l.title || "").toLowerCase().includes(q),
    );
  }, [links, search]);

  const totalClicks = links.reduce((s, l) => s + l.click_count, 0);
  const activeCount = links.filter((l) => l.is_active).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">URL Shortener</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Create and manage branded short links</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Links", value: links.length },
          { label: "Active", value: activeCount },
          { label: "Total Clicks", value: totalClicks.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm text-zinc-900">{editingId ? "Edit Short Link" : "Create Short Link"}</p>
              <button type="button" onClick={closeForm} className="text-zinc-400 hover:text-zinc-700"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Destination URL *</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  placeholder="https://example.com/very-long-url"
                  value={form.original_url}
                  onChange={(e) => setForm({ ...form, original_url: e.target.value })}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Custom alias <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900/20 focus-within:border-zinc-400 transition">
                    <span className="px-3 text-xs text-zinc-400 bg-zinc-50 border-r border-zinc-200 py-2.5 whitespace-nowrap">/s/</span>
                    <input
                      type="text"
                      placeholder="vendor-agreement"
                      value={form.alias}
                      onChange={(e) => setForm({ ...form, alias: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Label <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Vendor Agreement PDF"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Generate Link"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by alias, URL or label…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition bg-white"
        />
      </div>

      {/* Links list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Link2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">{search ? "No links match your search" : "No short links yet"}</p>
          {!search && (
            <button onClick={openCreate} className="mt-3 text-sm text-indigo-600 hover:underline">
              Create your first link →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onEdit={openEdit}
                onQr={setQrUrl}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* QR modal */}
      <AnimatePresence>
        {qrUrl && <QrModal url={qrUrl} onClose={() => setQrUrl(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default AdminShortLinks;
