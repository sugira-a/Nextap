import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, Mail, Globe, MessageCircle, Linkedin, Twitter, Instagram, Download, MapPin, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

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
};

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.4 } },
});

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileResponse["profile"] | null>(null);
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    const load = async () => {
      if (!username) return;

      try {
        const response = await apiRequest<PublicProfileResponse>(`/api/profile/${username}`);
        setProfile(response.profile);
        setDisplayName(response.user ? `${response.user.first_name} ${response.user.last_name}`.trim() : username);
      } catch {
        toast.error("Profile not found");
      }
    };

    load();
  }, [username]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  const handleSaveContact = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${displayName}\nTITLE:${profile.title || ''}\nTEL:${profile.phone || ''}\nEMAIL:${profile.email_public || ''}\nURL:${profile.website || ''}\nNOTE:${profile.bio || ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayName.replace(/\s/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contact downloaded");
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

  return (
    <div className="min-h-screen bg-surface">
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
                      <div className="grid grid-cols-4 gap-3 mt-6">
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
                <motion.div key="contact" {...fadeUp(0.2 + index * 0.1)} className="grid grid-cols-4 gap-3 mt-6">
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
            <motion.div {...fadeUp(0.6)} className="mt-6">
              <Button onClick={handleSaveContact} className={`w-full ${buttonClass} bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-sm font-semibold`}>
                <Download className="w-4 h-4 mr-2" /> Save Contact
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