import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode, Copy, ExternalLink, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

const MyCard = () => {
  const [card, setCard] = useState<any>(null);
  const [name, setName] = useState("User");
  const [slug, setSlug] = useState("user");

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      const response = await apiRequest<{ user: { first_name: string; last_name: string }; profile: { public_slug: string } | null; card?: any }>("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setName(`${response.user.first_name} ${response.user.last_name}`.trim());
      setSlug(response.profile?.public_slug || "user");
      setCard(response.card || null);
    };

    load().catch(() => toast.error("Failed to load card"));
  }, []);

  const cardUrl = `${window.location.origin}/card/${card?.code || ""}`;

  const copyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    toast.success("Link copied to clipboard");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">My Card</h1>
        <p className="text-sm text-muted-foreground mt-1">View your card status and sharing options</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center">
          <div className="w-full max-w-[280px] aspect-[1.6/1] rounded-2xl bg-primary relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 p-6 flex flex-col justify-between text-primary-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
                    <span className="text-accent-foreground text-[8px] font-bold">N</span>
                  </div>
                  <span className="font-heading text-xs font-semibold">NexTap</span>
                </div>
                <Wifi className="w-4 h-4 opacity-60" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm">{name}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{card?.status || "unassigned"}</p>
                <p className="font-mono text-[10px] opacity-50 mt-2">{card?.code || "No card assigned"}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge className="bg-accent/10 text-accent border-0 capitalize">{card?.status || "unassigned"}</Badge>
            <Badge variant="secondary" className="text-xs">NFC Enabled</Badge>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center">
          <div className="w-40 h-40 bg-secondary rounded-2xl flex items-center justify-center mb-4">
            <QrCode className="w-24 h-24 text-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Scan to view profile</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">/u/{slug}</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{card?.code ? cardUrl : "No card linked yet"}</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={copyLink} disabled={!card?.code}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`/u/${slug}`, "_blank")}>
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Preview
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold text-foreground mb-4">Card Details</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Card Code", value: card?.code || "Unassigned", icon: CreditCard },
            { label: "Status", value: card?.status || "unassigned", icon: Wifi },
            { label: "Profile", value: slug, icon: QrCode },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <p className="font-heading font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MyCard;