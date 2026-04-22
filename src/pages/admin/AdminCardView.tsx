import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";

type CardDetailResponse = {
  card: {
    id: string;
    code: string;
    short_code?: string;
    landing_path?: string;
    status: string;
    claim_status: boolean;
    created_at?: string | null;
  };
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assigned_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
    profile_slug?: string | null;
  } | null;
  tracking: {
    total_views: number;
    views_last_7_days: number;
    views_last_30_days: number;
    unique_visitors: number;
    last_view_at?: string | null;
  };
  recent_events: Array<{
    id: string;
    event_type: string;
    timestamp?: string | null;
    device_type?: string | null;
    browser?: string | null;
    os?: string | null;
    ip_address?: string | null;
    referrer?: string | null;
  }>;
};

const AdminCardView = () => {
  const { cardId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CardDetailResponse | null>(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = async () => {
    if (!cardId) return;

    try {
      setLoading(true);
      const response = await apiRequest<CardDetailResponse>(`/api/admin/cards/${cardId}`, {
        headers: authHeaders,
      });
      setData(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load card details");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [cardId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-sm text-zinc-400">Card not found</div>;
  }

  const publicPath = data.card.landing_path || `/card/${data.card.short_code || data.card.code}`;
  const publicUrl = `${window.location.origin}${publicPath}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(publicUrl)}`;

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
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Admin Â· Cards</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight font-mono">{data.card.code}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${data.card.status === "active" ? "bg-emerald-50 text-emerald-700" : data.card.status === "suspended" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-500"}`}>
            {data.card.status}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${data.card.claim_status ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
            {data.card.claim_status ? "Claimed" : "Free"}
          </span>
          <Link to="/admin/cards" className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">â† Back</Link>
          <button onClick={load} className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">Refresh</button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-px bg-zinc-200 rounded-2xl overflow-hidden border border-zinc-200">
        {[
          { label: "Total Views", value: data.tracking.total_views },
          { label: "Last 7 Days", value: data.tracking.views_last_7_days },
          { label: "Last 30 Days", value: data.tracking.views_last_30_days },
          { label: "Unique Visitors", value: data.tracking.unique_visitors },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.3 }} className="bg-white px-6 py-7">
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium">{s.label}</p>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight mt-1">{s.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>
      {data.tracking.last_view_at && (
        <p className="text-xs text-zinc-400 -mt-4">Last visit: {new Date(data.tracking.last_view_at).toLocaleString()}</p>
      )}

      {/* Details + QR */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
          <p className="text-sm font-semibold text-zinc-900">Public Identity</p>
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">Public URL</p>
            <p className="text-sm font-mono text-zinc-900 break-all">{publicUrl}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Link copied"); }} className="text-sm border border-zinc-200 rounded-xl px-4 py-2 text-zinc-500 hover:bg-zinc-50 transition-colors">Copy Link</button>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm border border-zinc-200 rounded-xl px-4 py-2 text-zinc-500 hover:bg-zinc-50 transition-colors">Open Public Route â†—</a>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-zinc-50 rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">Company</p>
              <p className="text-sm font-medium text-zinc-900">{data.company?.name || ""”"}</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">Assigned User</p>
              {data.assigned_user ? (
                <Link to={`/admin/users/${data.assigned_user.id}`} className="hover:text-zinc-600 transition-colors">
                  <p className="text-sm font-medium text-zinc-900">{data.assigned_user.first_name} {data.assigned_user.last_name}</p>
                  <p className="text-xs text-zinc-400">{data.assigned_user.email}</p>
                </Link>
              ) : <p className="text-sm text-zinc-400">Unassigned</p>}
            </div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">Created</p>
            <p className="text-sm text-zinc-700">{data.card.created_at ? new Date(data.card.created_at).toLocaleString() : ""”"}</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-4">QR Code</p>
          <img src={qrUrl} alt="Card QR" className="w-full rounded-xl border border-zinc-100" />
        </div>
      </div>

      {/* Recent visits */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-900">Recent Visits</p>
        </div>
        {data.recent_events.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-zinc-400">No visits yet</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {data.recent_events.map(event => (
              <div key={event.id} className="px-6 py-3.5 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-900 capitalize">{event.event_type}</p>
                  <p className="text-xs text-zinc-400">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ""”"}</p>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {[event.device_type, event.browser, event.os].filter(Boolean).join(" Â· ") || "Unknown device"}
                  {event.referrer && <span className="ml-2 truncate">Â· {event.referrer}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminCardView;