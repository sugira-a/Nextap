import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, Mail, Globe, MessageCircle, Linkedin, Twitter, Instagram, Download, MapPin, Share2, ExternalLink, UserPlus, Check, X, Youtube, Clock, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

// ── Active Design (canvas) types ──────────────────────────────────────────────
type CanvasElement = {
  id: string; type: string;
  x: number; y: number; w: number; h: number;
  text?: string; href?: string; src?: string;
  fontSize: number; color: string;
  align: "left" | "center" | "right";
  fontWeight: number; background: string; radius: number; padding: number;
  opacity: number; italic: boolean; zIndex: number; letterSpacing: number;
  iconName?: string; iconColor?: string;
  shadowBlur?: number; shadowColor?: string;
  hidden?: boolean; // Added property
};
type CanvasBg = { type: string; color: string; gradient: string; imageUrl?: string; };
type ActiveDesign = { elements: CanvasElement[]; bg: CanvasBg; } | null;

const CANVAS_ICON_MAP: Record<string, React.ElementType> = {
  Phone, Mail, Globe, MapPin, MessageCircle, Linkedin, Twitter, Instagram, Youtube, Clock, Send, Star,
};

type PublicProfileResponse = {
  profile: {
    public_slug: string;
    photo_url?: string | null;
    title?: string | null;
    bio?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email_public?: string | null;
    website?: string | null;
    location?: string | null;
    linkedin_url?: string | null;
    twitter_url?: string | null;
    instagram_url?: string | null;
    cover_color?: string | null;
    button_style?: string | null;
    font_style?: string | null;
    background_image_url?: string | null;
    background_overlay_opacity?: number | null;
    background_blur_strength?: number | null;
    section_order?: string | null;
    social_links_json?: string | null;
    contact_action_order?: string | null;
    enabled_contact_actions?: string | null;
    name_size?: number | null;
    title_size?: number | null;
    bio_size?: number | null;
    photo_size?: number | null;
    photo_offset_y?: number | null;
    name_bold?: boolean | null;
    title_bold?: boolean | null;
    bio_bold?: boolean | null;
    body_background_color?: string | null;
    body_text_color?: string | null;
    body_background_image_url?: string | null;
    action_hover_color?: string | null;
    show_exchange_contact?: boolean | null;
    layout_mode?: string | null;
    section_positions?: string | null;
    company_logo_url?: string | null;
    company_brand_color?: string | null;
  };
  user?: {
    first_name: string;
    last_name: string;
  } | null;
  company?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    primary_color?: string | null;
    accent_color?: string | null;
  } | null;
};

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.4 } },
});

type ShareForm = { name: string; phone: string; email: string; company: string };

type CanvasHandlers = {
  onSaveContact?: () => void;
  onShareContact?: () => void;
};

const renderCanvasElement = (element: CanvasElement, handlers?: CanvasHandlers) => {
  const base = {
    position: "absolute" as const,
    top: element.y,
    left: element.x,
    width: element.w,
    height: element.h,
    fontSize: element.fontSize,
    color: element.color,
    backgroundColor: element.background || undefined,
    borderRadius: element.radius,
    textAlign: element.align,
    fontWeight: element.fontWeight,
    fontStyle: element.italic ? "italic" as const : "normal" as const,
    opacity: element.opacity ?? 1,
    zIndex: element.zIndex ?? 0,
    letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
    boxShadow: element.shadowBlur ? `0 0 ${element.shadowBlur}px ${element.shadowColor}` : undefined,
    padding: element.padding ? element.padding : undefined,
    overflow: "hidden" as const,
  };

  if (element.hidden) return null;

  const resolveHref = (iconName?: string, text?: string, explicitHref?: string): string | undefined => {
    if (explicitHref?.trim()) {
      const h = explicitHref.trim();
      return /^(https?:\/\/|tel:|mailto:)/i.test(h) ? h : `https://${h}`;
    }
    const t = (text || "").trim();
    if (!t) return undefined;
    switch (iconName) {
      case "Phone":
        return `tel:${t.replace(/\s/g, "")}`;
      case "Mail":
        return `mailto:${t}`;
      case "MessageCircle":
        return `https://wa.me/${t.replace(/[^0-9]/g, "")}`;
      case "Globe":
        return /^https?:\/\//i.test(t) ? t : `https://${t}`;
      case "Linkedin":
        return /^https?:\/\//i.test(t) ? t : `https://linkedin.com/in/${t}`;
      case "Twitter":
        return /^https?:\/\//i.test(t) ? t : `https://twitter.com/${t}`;
      case "Instagram":
        return /^https?:\/\//i.test(t) ? t : `https://instagram.com/${t}`;
      case "MapPin":
        return `https://maps.google.com/?q=${encodeURIComponent(t)}`;
      default:
        return undefined;
    }
  };

  const isSaveBtn = /save.contact/i.test(element.text || "");
  const isShareBtn = /share.my.contact/i.test(element.text || "");

  const buttonBaseStyle: React.CSSProperties = {
    ...base,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    textDecoration: "none",
    boxSizing: "border-box",
    overflow: "hidden",
    border: "none",
    outline: "none",
  };

  switch (element.type) {
    case "text":
      return (
        <div
          key={element.id}
          style={{
            ...base,
            display: 'block',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            lineHeight: element.fontSize ? Math.max(1, Math.round(element.fontSize * 0.06) + 1) : 1.15,
          }}
        >
          {element.text}
        </div>
      );
    case "button": {
      if (isSaveBtn && handlers?.onSaveContact) {
        return (
          <button key={element.id} onClick={handlers.onSaveContact} style={buttonBaseStyle}>
            {element.text}
          </button>
        );
      }
      if (isShareBtn && handlers?.onShareContact) {
        return (
          <button key={element.id} onClick={handlers.onShareContact} style={buttonBaseStyle}>
            {element.text}
          </button>
        );
      }
      const href = resolveHref(undefined, element.href, element.href);
      return href ? (
        <a key={element.id} href={href} target="_blank" rel="noreferrer" style={buttonBaseStyle}>
          {element.text}
        </a>
      ) : (
        <button key={element.id} style={buttonBaseStyle}>{element.text}</button>
      );
    }
    case "image":
      if (!element.src) return null;
      return <img key={element.id} src={element.src} alt="" style={{ ...base, objectFit: "cover" }} />;
    case "shape":
      return <div key={element.id} style={base} />;
    case "divider":
      return <div key={element.id} style={{ ...base, backgroundColor: element.background || element.color }} />;
    case "icon_row": {
      const Icon = CANVAS_ICON_MAP[element.iconName || ""];
      const href = resolveHref(element.iconName, element.text, element.href);
      const inner = (
        <>
          {Icon && <Icon size={element.fontSize || 16} color={element.iconColor || element.color} style={{ flexShrink: 0 }} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal", display: 'inline-block', maxWidth: '100%' }}>{element.text}</span>
        </>
      );
      return href ? (
        <a key={element.id} href={href} target={element.iconName === "Phone" || element.iconName === "Mail" ? undefined : "_blank"} rel="noreferrer"
          style={{ ...base, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", cursor: "pointer" }}>
          {inner}
        </a>
      ) : (
        <div key={element.id} style={{ ...base, display: "flex", alignItems: "center", gap: 8 }}>
          {inner}
        </div>
      );
    }
    default:
      return null;
  }
};

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileResponse["profile"] | null>(null);
  const [displayName, setDisplayName] = useState("User");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareForm, setShareForm] = useState<ShareForm>({ name: "", phone: "", email: "", company: "" });
  const [shareSubmitted, setShareSubmitted] = useState(false);
  const [activeDesign, setActiveDesign] = useState<ActiveDesign>(null);
  const [company, setCompany] = useState<PublicProfileResponse["company"] | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const CANVAS_W = 390;
  const CANVAS_H = 700;

  useEffect(() => {
    const el = canvasWrapperRef.current;
    if (!el) return;
    const update = () => {
      const availW = el.offsetWidth;
      if (availW > 0) setCanvasScale(Math.min(1, availW / CANVAS_W));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  });

  useEffect(() => {
    const load = async () => {
      if (!username) return;

      try {
        const [profileRes, designRes] = await Promise.allSettled([
          apiRequest<PublicProfileResponse>(`/api/profile/${username}`),
          apiRequest<{ design: ActiveDesign }>(`/api/designs/public/${username}`),
        ]);

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value.profile);
          setCompany(profileRes.value.company || null);
          setDisplayName(profileRes.value.user ? profileRes.value.user.first_name.trim().replace(/\b\w/g, (c: string) => c.toUpperCase()) : username.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
          // Lazy-load heavy image fields after the profile renders
          apiRequest<{ photo_url: string | null; background_image_url: string | null; body_background_image_url: string | null }>(`/api/profile/${username}/images`)
            .then((imgs) => {
              setProfile((prev) => prev ? {
                ...prev,
                photo_url: imgs.photo_url ?? prev.photo_url,
                background_image_url: imgs.background_image_url ?? prev.background_image_url,
                body_background_image_url: imgs.body_background_image_url ?? prev.body_background_image_url,
              } : prev);
            })
            .catch(() => undefined);
        } else {
          toast.error("Profile not found");
        }

        if (designRes.status === "fulfilled" && designRes.value.design) {
          setActiveDesign(designRes.value.design);
        }
      } catch {
        toast.error("Profile not found");
      }
    };

    load();
  }, [username]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center">
        <div className="w-full max-w-md bg-card min-h-screen shadow-2xl relative">
          {/* Cover skeleton */}
          <div className="h-44 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          {/* Avatar skeleton */}
          <div className="flex justify-center -mt-16 relative z-10">
            <div className="w-28 h-28 rounded-full border-4 border-card bg-zinc-300 dark:bg-zinc-700 animate-pulse shadow-xl" />
          </div>
          {/* Text skeletons */}
          <div className="px-6 pt-4 space-y-3">
            <div className="h-6 w-40 mx-auto rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-4 w-28 mx-auto rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-3 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse mt-2" />
            <div className="h-3 w-4/5 mx-auto rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            {/* Button skeletons */}
            <div className="grid grid-cols-4 gap-2 pt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveContact = () => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${displayName}`,
      profile.title ? `TITLE:${profile.title}` : "",
      profile.phone ? `TEL;TYPE=CELL:${profile.phone}` : "",
      profile.whatsapp ? `TEL;TYPE=WORK:${profile.whatsapp}` : "",
      profile.email_public ? `EMAIL:${profile.email_public}` : "",
      profile.website ? `URL:${profile.website.startsWith("http") ? profile.website : "https://" + profile.website}` : "",
      profile.location ? `ADR;TYPE=WORK:;;${profile.location};;;;` : "",
      profile.linkedin_url ? `X-SOCIALPROFILE;type=linkedin:${profile.linkedin_url}` : "",
      profile.twitter_url ? `X-SOCIALPROFILE;type=twitter:${profile.twitter_url}` : "",
      profile.instagram_url ? `X-SOCIALPROFILE;type=instagram:${profile.instagram_url}` : "",
      profile.bio ? `NOTE:${profile.bio}` : "",
      "END:VCARD",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayName.replace(/\s/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contact downloaded");
  };

  const handleShareContact = async () => {
    if (!shareForm.name || (!shareForm.phone && !shareForm.email)) {
      toast.error("Name and phone or email are required.");
      return;
    }
    try {
      await apiRequest(`/api/profile/${username}/share-contact`, {
        method: "POST",
        body: JSON.stringify(shareForm),
      });
      toast.success(`Your contact was sent to ${displayName}!`);
      setShareSubmitted(true);
    } catch {
      toast.error("Failed to send contact. Please try again.");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: displayName, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const toExternalUrl = (value: string) => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      return "";
    }
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const buttonClass = profile.button_style === "rounded-full"
    ? "rounded-full"
    : profile.button_style === "rounded-none"
      ? "rounded-none"
      : "rounded-lg";

  const headingClass = profile.font_style === "Classic" ? "font-body" : "font-heading";

  const publicSectionOrder = (() => {
    if (!profile.section_order) {
      return ["identity", "contact", "social"];
    }
    try {
      const parsed = JSON.parse(profile.section_order);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as string[];
      }
    } catch {
      return ["identity", "contact", "social"];
    }
    return ["identity", "contact", "social"];
  })();

  const publicLayoutMode = profile.layout_mode === "freeform" ? "freeform" : "stack";

  const publicSectionPositions = (() => {
    if (!profile.section_positions) {
      return { identity: { x: 0, y: 0 }, contact: { x: 0, y: 100 }, social: { x: 0, y: 154 } };
    }
    try {
      const parsed = JSON.parse(profile.section_positions);
      return parsed && typeof parsed === "object"
        ? { identity: { x: 0, y: 0 }, contact: { x: 0, y: 100 }, social: { x: 0, y: 154 }, ...parsed }
        : { identity: { x: 0, y: 0 }, contact: { x: 0, y: 100 }, social: { x: 0, y: 154 } };
    } catch {
      return { identity: { x: 0, y: 0 }, contact: { x: 0, y: 100 }, social: { x: 0, y: 154 } };
    }
  })();

  const socialLinks = (() => {
    if (!profile.social_links_json) {
      return [] as Array<{ id: string; platform: string; url: string; icon: string }>;
    }
    try {
      const parsed = JSON.parse(profile.social_links_json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [] as Array<{ id: string; platform: string; url: string; icon: string }>;
    }
  })();

  const contactActionOrder = (() => {
    if (!profile.contact_action_order) {
      return ["phone", "email", "whatsapp", "website"];
    }
    try {
      const parsed = JSON.parse(profile.contact_action_order);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed as string[] : ["phone", "email", "whatsapp", "website"];
    } catch {
      return ["phone", "email", "whatsapp", "website"];
    }
  })();

  const enabledContactActions = (() => {
    if (!profile.enabled_contact_actions) {
      return {} as Record<string, boolean>;
    }
    try {
      const parsed = JSON.parse(profile.enabled_contact_actions);
      return parsed && typeof parsed === "object" ? parsed as Record<string, boolean> : {};
    } catch {
      return {} as Record<string, boolean>;
    }
  })();

  const contactActionLookup: Record<string, { label: string; icon: typeof Phone; href: string; show: boolean }> = {
    phone: { label: "Call", icon: Phone, href: `tel:${profile.phone || ""}`, show: !!profile.phone },
    email: { label: "Email", icon: Mail, href: `mailto:${profile.email_public || ""}`, show: !!profile.email_public },
    whatsapp: { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/${profile.whatsapp || ""}`, show: !!profile.whatsapp },
    website: { label: "Website", icon: Globe, href: toExternalUrl(profile.website || ""), show: !!profile.website },
  };

  const socialLinkLookup: Record<string, { icon: typeof Linkedin }> = {
    LinkedIn: { icon: Linkedin },
    Twitter: { icon: Twitter },
    Instagram: { icon: Instagram },
  };

  const cardPhotoSize = profile.photo_size || 128;
  const cardPhotoOffset = profile.photo_offset_y || 0;
  const cardBodyColor = profile.body_background_color || "#ffffff";
  const cardTextColor = profile.body_text_color || "#0f172a";
  const cardHoverColor = profile.action_hover_color || "#22c55e";
  const cardShowExchange = profile.show_exchange_contact !== false;
  const cardNameSize = profile.name_size || 24;
  const cardTitleSize = profile.title_size || 14;
  const cardBioSize = profile.bio_size || 14;

  const resolveTokenizedValue = (value?: string | null) => {
    if (!value) return "";
    const firstName = (displayName || "").split(" ")[0] || "";
    const lastName = (displayName || "").split(" ").slice(1).join(" ");
    const tokenMap: Record<string, string> = {
      first_name: firstName,
      last_name: lastName,
      full_name: displayName,
      title: profile.title || "",
      bio: profile.bio || "",
      phone: profile.phone || "",
      whatsapp: profile.whatsapp || "",
      email_public: profile.email_public || "",
      website: profile.website || "",
      company_website: profile.website || "",
      location: profile.location || "",
      profile_photo: profile.photo_url || "",
      company_name: company?.name || "",
      company_slug: company?.slug || "",
      company_logo: profile.company_logo_url || company?.logo_url || "",
      company_primary_color: profile.company_brand_color || company?.primary_color || "",
      company_accent_color: company?.accent_color || "",
      linkedin: profile.linkedin_url || "",
      twitter: profile.twitter_url || "",
      instagram: profile.instagram_url || "",
    };
    return value.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, token: string) => tokenMap[token.toLowerCase()] ?? "");
  };

  const resolvedActiveDesign: ActiveDesign = activeDesign
    ? {
        ...activeDesign,
        elements: (activeDesign.elements || []).map((el) => ({
          ...el,
          text: resolveTokenizedValue(el.text),
          href: resolveTokenizedValue(el.href),
          src: resolveTokenizedValue(el.src),
        })),
      }
    : null;

  // If custom design exists, show only the design canvas + footer
  if (resolvedActiveDesign && resolvedActiveDesign.elements && resolvedActiveDesign.elements.length > 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-start sm:justify-center py-8 px-4">
        {shareOpen && (
          <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4" onClick={() => setShareOpen(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1c22] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Send your contact</p>
                    <p className="text-xs text-muted-foreground">to <span className="font-medium text-foreground capitalize">{displayName}</span></p>
                  </div>
                </div>
                <button onClick={() => setShareOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              {shareSubmitted ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="font-semibold text-foreground">Contact Sent!</p>
                  <p className="text-sm text-muted-foreground">{displayName} will receive your details.</p>
                  <button onClick={() => setShareOpen(false)} className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors">Done</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {([{key:"name",label:"Full name *",type:"text"},{key:"phone",label:"Phone *",type:"tel"},{key:"email",label:"Email",type:"email"},{key:"company",label:"Company",type:"text"}] as {key:keyof ShareForm;label:string;type:string}[]).map(({key,label,type}) => (
                    <input key={key} type={type} placeholder={label}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={shareForm[key]} onChange={(e) => setShareForm({...shareForm,[key]:e.target.value})} />
                  ))}
                  <button onClick={handleShareContact} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors mt-1">
                    Send My Contact
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col items-center w-full">
          <div
            ref={canvasWrapperRef}
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{ width: "100%", maxWidth: CANVAS_W, height: CANVAS_H * canvasScale, flexShrink: 0 }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                transform: `scale(${canvasScale})`,
                transformOrigin: "top left",
                ...(activeDesign.bg?.type === "gradient"
                  ? { background: resolvedActiveDesign.bg.gradient }
                  : resolvedActiveDesign.bg?.imageUrl
                    ? { backgroundImage: `url(${resolvedActiveDesign.bg.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { backgroundColor: resolvedActiveDesign.bg?.color || "#ffffff" }
                ),
              }}
            >
              {resolvedActiveDesign.elements.map((element) => renderCanvasElement(element, {
                onSaveContact: handleSaveContact,
                onShareContact: () => { setShareSubmitted(false); setShareForm({ name: "", phone: "", email: "", company: "" }); setShareOpen(true); },
              }))}
            </div>
          </div>
          <a href="/" className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-medium">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center shadow">
              <span className="text-primary-foreground text-[9px] font-bold">N</span>
            </div>
            Powered by NexTap
          </a>
        </div>
      </div>
    );
  }

  // Standard profile layout (no custom design)
  return (
    <div className="min-h-screen bg-surface">
      {/* Share My Contact Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4" onClick={() => setShareOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1c22] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Send your contact</p>
                  <p className="text-xs text-muted-foreground">to <span className="font-medium text-foreground capitalize">{displayName}</span></p>
                </div>
              </div>
              <button onClick={() => setShareOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {shareSubmitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-semibold text-foreground">Contact Sent!</p>
                <p className="text-sm text-muted-foreground">{displayName} will receive your details.</p>
                <button onClick={() => setShareOpen(false)} className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors">Done</button>
              </div>
            ) : (
              <div className="space-y-3">
                {([{key:"name",label:"Full name *",type:"text"},{key:"phone",label:"Phone *",type:"tel"},{key:"email",label:"Email",type:"email"},{key:"company",label:"Company",type:"text"}] as {key:keyof ShareForm;label:string;type:string}[]).map(({key,label,type}) => (
                  <input key={key} type={type} placeholder={label}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-emerald-500/30"
                    value={shareForm[key]} onChange={(e) => setShareForm({...shareForm,[key]:e.target.value})} />
                ))}
                <button onClick={handleShareContact} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors mt-1">
                  Send My Contact
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="max-w-md mx-auto bg-card min-h-screen shadow-2xl relative">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-44 relative overflow-hidden" style={{ background: profile.cover_color || profile.company_brand_color || "#141414" }}>
          {profile.background_image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${profile.background_image_url})`,
                filter: `blur(${profile.background_blur_strength || 0}px)`,
                transform: profile.background_blur_strength ? "scale(1.08)" : "none",
              }}
            />
          )}
          {profile.background_image_url && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: Math.max(0, Math.min(80, profile.background_overlay_opacity || 0)) / 100 }}
            />
          )}
          <button onClick={handleShare} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/30 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="flex justify-center -mt-16 relative z-10">
          <div
            className="rounded-full border-4 border-card bg-muted overflow-hidden shadow-xl flex items-center justify-center bg-accent text-accent-foreground font-heading font-bold"
            style={{ width: `${cardPhotoSize}px`, height: `${cardPhotoSize}px`, transform: `translateY(${cardPhotoOffset}px)` }}
          >
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0) || "U"
            )}
          </div>
        </motion.div>

        <div
          className="px-6 pb-10 pt-4"
          style={{
            color: cardTextColor,
            backgroundColor: cardBodyColor,
            backgroundImage: profile.body_background_image_url ? `url(${profile.body_background_image_url})` : undefined,
            backgroundSize: profile.body_background_image_url ? "cover" : undefined,
            backgroundPosition: profile.body_background_image_url ? "center" : undefined,
          }}
        >
          {publicLayoutMode === "freeform" ? (
            <div className="relative h-[260px] rounded-lg border border-dashed border-border/70 bg-background/15">
              {publicSectionOrder.map((section) => {
                const position = publicSectionPositions[section] || { x: 0, y: 0 };
                if (section === "identity") {
                  return (
                    <motion.div key="identity" className="absolute left-0 right-0 px-2 text-center" style={{ x: position.x, y: position.y }}>
                      <h1 className={headingClass} style={{ fontSize: `${cardNameSize}px`, fontWeight: profile.name_bold === false ? 500 : 700, color: cardTextColor }}>{displayName}</h1>
                      <p className="mt-1" style={{ fontSize: `${cardTitleSize}px`, fontWeight: profile.title_bold ? 600 : 400, color: cardTextColor }}>{profile.title || ""}</p>
                      {profile.location && (
                        <p className="mt-1.5 flex items-center justify-center gap-1" style={{ color: cardTextColor, fontSize: `${Math.max(11, cardTitleSize - 2)}px` }}><MapPin className="w-3 h-3" /> {profile.location}</p>
                      )}
                      <p className="text-center mt-4 leading-relaxed" style={{ fontSize: `${cardBioSize}px`, fontWeight: profile.bio_bold ? 600 : 400, color: cardTextColor }}>{profile.bio || ""}</p>
                    </motion.div>
                  );
                }

                if (section === "contact") {
                  return (
                    <motion.div key="contact" className="absolute left-0 right-0 px-2" style={{ x: position.x, y: position.y }}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                        {contactActionOrder.map((actionId) => {
                          const action = contactActionLookup[actionId];
                          if (!action || enabledContactActions[actionId] === false || !action.show) {
                            return null;
                          }

                          return (
                            <a
                              key={actionId}
                              href={action.href}
                              target={action.href?.startsWith("http") ? "_blank" : undefined}
                              rel="noreferrer"
                              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary transition-all group"
                              style={{ backgroundColor: "rgba(148,163,184,0.15)" }}
                              onMouseEnter={(event) => {
                                event.currentTarget.style.backgroundColor = cardHoverColor;
                                event.currentTarget.style.color = "#ffffff";
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.backgroundColor = "rgba(148,163,184,0.15)";
                                event.currentTarget.style.color = cardTextColor;
                              }}
                            >
                              <action.icon className="w-5 h-5" />
                              <span className="text-[10px] font-medium">{action.label}</span>
                            </a>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                }

                if (section === "social" && socialLinks.length > 0) {
                  return (
                    <motion.div key="social" className="absolute left-0 right-0 px-2" style={{ x: position.x, y: position.y }}>
                      <div className="mt-4 space-y-2">
                        {socialLinks.map((link) => {
                          if (!link.url) {
                            return null;
                          }
                          const Icon = socialLinkLookup[link.platform]?.icon || Linkedin;
                          return (
                            <a key={link.id} href={toExternalUrl(link.url)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors group">
                              <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center">
                                <Icon className="w-4 h-4 text-foreground" />
                              </div>
                              <span className="text-sm font-medium text-foreground flex-1">{link.platform}</span>
                              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                }

                return null;
              })}
            </div>
          ) : publicSectionOrder.map((section, index) => {
            if (section === "identity") {
              return (
                <motion.div key="identity" {...fadeUp(0.2 + index * 0.1)} className="text-center">
                  <h1 className={headingClass} style={{ fontSize: `${cardNameSize}px`, fontWeight: profile.name_bold === false ? 500 : 700, color: cardTextColor }}>{displayName}</h1>
                  <p className="mt-1" style={{ fontSize: `${cardTitleSize}px`, fontWeight: profile.title_bold ? 600 : 400, color: cardTextColor }}>{profile.title || ""}</p>
                  {profile.location && (
                    <p className="mt-1.5 flex items-center justify-center gap-1" style={{ color: cardTextColor, fontSize: `${Math.max(11, cardTitleSize - 2)}px` }}><MapPin className="w-3 h-3" /> {profile.location}</p>
                  )}
                  <p className="text-center mt-4 leading-relaxed" style={{ fontSize: `${cardBioSize}px`, fontWeight: profile.bio_bold ? 600 : 400, color: cardTextColor }}>{profile.bio || ""}</p>
                </motion.div>
              );
            }

            if (section === "contact") {
              return (
                <motion.div key="contact" {...fadeUp(0.2 + index * 0.1)} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  {contactActionOrder.map((actionId) => {
                    const action = contactActionLookup[actionId];
                    if (!action || enabledContactActions[actionId] === false || !action.show) {
                      return null;
                    }

                    return (
                      <a
                        key={actionId}
                        href={action.href}
                        target={action.href?.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary transition-all group"
                        style={{ backgroundColor: "rgba(148,163,184,0.15)" }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = cardHoverColor;
                          event.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = "rgba(148,163,184,0.15)";
                          event.currentTarget.style.color = cardTextColor;
                        }}
                      >
                        <action.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{action.label}</span>
                      </a>
                    );
                  })}
                </motion.div>
              );
            }

            if (section === "social" && socialLinks.length > 0) {
              return (
                <motion.div key="social" {...fadeUp(0.2 + index * 0.1)} className="mt-4 space-y-2">
                  {socialLinks.map((link) => {
                    if (!link.url) {
                      return null;
                    }
                    const Icon = socialLinkLookup[link.platform]?.icon || Linkedin;
                    return (
                      <a key={link.id} href={toExternalUrl(link.url)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center">
                          <Icon className="w-4 h-4 text-foreground" />
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1">{link.platform}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </motion.div>
              );
            }

            return null;
          })}

          {cardShowExchange && (
            <motion.div {...fadeUp(0.6)} className="mt-6 space-y-3">
              <Button onClick={handleSaveContact} className={`w-full ${buttonClass} bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-sm font-semibold`}>
                <Download className="w-4 h-4 mr-2" /> Save Contact
              </Button>
              <Button variant="outline" onClick={() => { setShareSubmitted(false); setShareForm({name:"",phone:"",email:"",company:""}); setShareOpen(true); }} className={`w-full ${buttonClass} border-border bg-transparent hover:bg-secondary h-12 text-sm font-semibold text-foreground`}>
                <UserPlus className="w-4 h-4 mr-2" /> Share My Contact
              </Button>
            </motion.div>
          )}

          <motion.div {...fadeUp(0.7)} className="mt-8 text-center">
            <a href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[8px] font-bold">N</span>
              </div>
              Powered by NexTap
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;