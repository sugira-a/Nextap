import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Copy, Check, ExternalLink, Wifi, CreditCard, User, Hash } from "lucide-react";
import { apiRequest } from "@/lib/api";

const MyCard = () => {
  const [card, setCard] = useState<any>(null);
  const [name, setName] = useState("User");
  const [slug, setSlug] = useState("user");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyLink = async (url: string, key: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedKey(key);
    toast.success("Copied to clipboard", { duration: 2000 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      const response = await apiRequest<{ user: { first_name: string; last_name: string }; profile: { public_slug: string } | null; card?: any }>("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setName(response.user.first_name || response.user.last_name || "User");
      setSlug(response.profile?.public_slug || "user");
      setCard(response.card || null);
    };
    load().catch(() => toast.error("Failed to load card", { duration: 2000 }));
  }, []);

  const profileUrl = `${window.location.origin}/u/${slug}`;
  const cardUrl = `${window.location.origin}/card/${card?.code || ""}`;

  const isActive = card?.status === "active";

  // remove old copyLink below — replaced above

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Card visual */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col items-center gap-6"
        >
          {/* Physical card mockup */}
          <div className="w-full max-w-[300px] aspect-[1.586/1] rounded-2xl bg-zinc-900 relative overflow-hidden shadow-2xl select-none">
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_20%_80%,white,transparent_50%),radial-gradient(circle_at_80%_20%,white,transparent_50%)]" />
            <div className="absolute inset-0 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                    <span className="text-zinc-900 text-[9px] font-black">N</span>
                  </div>
                  <span className="text-white text-xs font-semibold tracking-wide">NexTap</span>
                </div>
                {/* NFC icon */}
                <svg className="w-5 h-5 text-white opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8.5 8.5a5 5 0 0 1 7 7" strokeLinecap="round"/>
                  <path d="M6 6a8 8 0 0 1 12 12" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wide">{name}</p>
                <p className="text-zinc-400 text-[10px] mt-0.5 capitalize">{card?.status || "unassigned"}</p>
                <p className="text-zinc-600 font-mono text-[9px] mt-2 tracking-widest">{card?.code || "— — — — —"}</p>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
              {card?.status ? card.status.charAt(0).toUpperCase() + card.status.slice(1) : "Unassigned"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
              NFC Enabled
            </span>
          </div>
        </motion.div>

        {/* QR + sharing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-5"
        >
          {/* QR placeholder — real QR via profile URL */}
          <div className="w-40 h-40 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center overflow-hidden">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(profileUrl)}&bgcolor=fafafa&color=18181b&margin=10`}
              alt="QR code"
              className="w-36 h-36"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-900">Scan to view profile</p>
            <p className="text-xs text-zinc-400 mt-1 font-mono">/u/{slug}</p>
            {card?.code && (
              <p className="text-xs text-zinc-300 mt-0.5 font-mono truncate max-w-[220px]">{cardUrl}</p>
            )}
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => copyLink(profileUrl, "qr")}
              className="flex-1 py-2.5 text-sm font-semibold text-zinc-900 border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              {copiedKey === "qr" ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => window.open(`/u/${slug}`, "_blank")}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-zinc-900 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Preview →
            </button>
          </div>
        </motion.div>
      </div>

      {/* Card Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-900">Card Details</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {[
            {
              icon: <Hash className="w-3.5 h-3.5" />,
              label: "Card Code",
              value: card?.code || "Unassigned",
              mono: true,
            },
            {
              icon: <Wifi className="w-3.5 h-3.5" />,
              label: "Status",
              value: card?.status ? card.status.charAt(0).toUpperCase() + card.status.slice(1) : "Unassigned",
              mono: false,
              badge: true,
            },
            {
              icon: <User className="w-3.5 h-3.5" />,
              label: "Profile",
              value: `/u/${slug}`,
              mono: true,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/60 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mb-0.5">{item.label}</p>
                {item.badge ? (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    {item.value}
                  </span>
                ) : (
                  <p className={`text-sm font-semibold text-zinc-900 truncate ${item.mono ? "font-mono tracking-wide" : ""}`}>{item.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Share */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-900">Share</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {[
            { key: "profile", label: "Profile URL", value: profileUrl, action: () => copyLink(profileUrl, "profile") },
            ...(card?.code ? [{ key: "card", label: "Card URL", value: cardUrl, action: () => copyLink(cardUrl, "card") }] : []),
          ].map((row) => (
            <div key={row.key} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/60 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">{row.label}</p>
                <p className="text-sm text-zinc-700 font-mono truncate">{row.value}</p>
              </div>
              <button
                onClick={row.action}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all shrink-0 ${
                  copiedKey === row.key
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300"
                }`}>
                {copiedKey === row.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === row.key ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MyCard;