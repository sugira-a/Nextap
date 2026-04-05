import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, ExternalLink, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    return <Card className="p-8 text-center text-muted-foreground">Loading card details...</Card>;
  }

  if (!data) {
    return <Card className="p-8 text-center text-muted-foreground">Card not found</Card>;
  }

  const publicPath = data.card.landing_path || `/card/${data.card.short_code || data.card.code}`;
  const publicUrl = `${window.location.origin}${publicPath}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(publicUrl)}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/cards">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Cards
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Card Tracking</h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">{data.card.code}</p>
          </div>
          <div className="flex gap-2">
            <Badge className="capitalize">{data.card.status}</Badge>
            <Badge variant="secondary">{data.card.claim_status ? "Claimed" : "Waiting Assignment"}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4">
          <h2 className="font-heading font-semibold">Public Identity</h2>
          <div className="rounded-md border border-border p-3 bg-secondary/20">
            <p className="text-xs text-muted-foreground">Short Link</p>
            <p className="text-sm font-mono break-all text-foreground">{publicUrl}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Card link copied");
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open Public Route
              </a>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="text-sm font-medium text-foreground mt-1">{data.company?.name || "-"}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">Assigned User</p>
              <p className="text-sm font-medium text-foreground mt-1">
                {data.assigned_user ? `${data.assigned_user.first_name} ${data.assigned_user.last_name}` : "Unassigned"}
              </p>
              {data.assigned_user && (
                <p className="text-xs text-muted-foreground">{data.assigned_user.email}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-heading font-semibold">QR</h2>
          </div>
          <img src={qrUrl} alt="Card QR" className="w-full rounded-lg border border-border" />
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Views</p>
          <p className="font-heading text-2xl font-bold mt-1">{data.tracking.total_views}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Last 7 Days</p>
          <p className="font-heading text-2xl font-bold mt-1">{data.tracking.views_last_7_days}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Last 30 Days</p>
          <p className="font-heading text-2xl font-bold mt-1">{data.tracking.views_last_30_days}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Unique Visitors</p>
          <p className="font-heading text-2xl font-bold mt-1">{data.tracking.unique_visitors}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.tracking.last_view_at ? `Last: ${new Date(data.tracking.last_view_at).toLocaleString()}` : "No visits yet"}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-heading font-semibold mb-4">Recent Visits</h2>
        {data.recent_events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visits yet.</p>
        ) : (
          <div className="space-y-2">
            {data.recent_events.map((event) => (
              <div key={event.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-medium text-foreground capitalize">{event.event_type}</p>
                  <p className="text-xs text-muted-foreground">{event.timestamp ? new Date(event.timestamp).toLocaleString() : "-"}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {[event.device_type, event.browser, event.os].filter(Boolean).join(" · ") || "Unknown device"}
                </p>
                {event.referrer && <p className="text-xs text-muted-foreground mt-1 truncate">Referrer: {event.referrer}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default AdminCardView;
