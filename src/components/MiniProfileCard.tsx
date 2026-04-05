import { Phone, Mail, Globe, MessageCircle, Linkedin, Twitter, Instagram, Download, MapPin, Link2, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ProfileData {
  name: string;
  title: string;
  company: string;
  bio: string;
  avatar?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  location?: string;
  coverColor?: string;
  buttonStyle?: string;
  fontStyle?: string;
  backgroundImageUrl?: string;
  backgroundOverlayOpacity?: number;
  backgroundBlurStrength?: number;
  bodyBackgroundColor?: string;
  bodyTextColor?: string;
  bodyBackgroundImageUrl?: string;
  actionHoverColor?: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

type SectionPosition = { x: number; y: number };

interface MiniProfileCardProps {
  profile: ProfileData;
  sectionOrder?: string[];
  buttonStyle?: string;
  fontStyle?: string;
  nameSize?: number;
  titleSize?: number;
  bioSize?: number;
  nameBold?: boolean;
  titleBold?: boolean;
  bioBold?: boolean;
  photoSize?: number;
  photoOffsetY?: number;
  showExchangeContact?: boolean;
  contactActionOrder?: string[];
  enabledContactActions?: Record<string, boolean>;
  links?: SocialLink[];
  layoutMode?: "stack" | "freeform";
  sectionPositions?: Record<string, SectionPosition>;
  editableLayout?: boolean;
  onSectionPositionChange?: (sectionId: string, position: SectionPosition) => void;
}

const buttonClassMap: Record<string, string> = {
  "rounded-lg": "rounded-lg",
  "rounded-full": "rounded-full",
  "rounded-none": "rounded-none",
};

const fontClassMap: Record<string, string> = {
  Modern: "font-heading",
  Classic: "font-body",
};

const MiniProfileCard = ({
  profile,
  sectionOrder = ["identity", "contact", "social"],
  buttonStyle,
  fontStyle,
  nameSize = 16,
  titleSize = 12,
  bioSize = 12,
  nameBold = true,
  titleBold = false,
  bioBold = false,
  photoSize = 80,
  photoOffsetY = 0,
  showExchangeContact = false,
  contactActionOrder = ["phone", "email", "whatsapp", "website"],
  enabledContactActions,
  links,
  layoutMode = "stack",
  sectionPositions,
  editableLayout = false,
  onSectionPositionChange,
}: MiniProfileCardProps) => {
  const resolvedButton = buttonClassMap[buttonStyle || profile.buttonStyle || "rounded-lg"] || "rounded-lg";
  const resolvedFont = fontClassMap[fontStyle || profile.fontStyle || "Modern"] || "font-heading";
  const displayName = profile.name || "Your Name";

  const toExternalUrl = (value: string) => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      return "";
    }
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const textColor = profile.bodyTextColor || "#0f172a";
  const actionHoverColor = profile.actionHoverColor || "#22c55e";
  const socialLinks = (links && links.length > 0 ? links : [
    { id: "linkedin", platform: "LinkedIn", url: profile.linkedin || "", icon: "LinkedIn" },
    { id: "twitter", platform: "Twitter", url: profile.twitter || "", icon: "Twitter" },
    { id: "instagram", platform: "Instagram", url: profile.instagram || "", icon: "Instagram" },
  ]).filter((item) => item.url);
  const socialIconLookup: Record<string, typeof Linkedin> = {
    LinkedIn: Linkedin,
    Twitter: Twitter,
    Instagram: Instagram,
    Website: Globe,
  };
  const actionLookup: Record<string, { show: boolean; icon: typeof Phone }> = {
    phone: { show: !!profile.phone, icon: Phone },
    email: { show: !!profile.email, icon: Mail },
    whatsapp: { show: !!profile.whatsapp, icon: MessageCircle },
    website: { show: !!profile.website, icon: Globe },
  };

  const defaultPositions: Record<string, SectionPosition> = {
    identity: { x: 0, y: 0 },
    contact: { x: 0, y: 100 },
    social: { x: 0, y: 154 },
  };

  const resolvedPositions = {
    ...defaultPositions,
    ...(sectionPositions || {}),
  };

  const renderSection = (section: string) => {
    if (section === "identity") {
      return (
        <div key="identity">
          <h3 className={`${resolvedFont} ${nameBold ? "font-bold" : "font-medium"} leading-tight`} style={{ fontSize: `${nameSize}px`, color: textColor }}>{displayName}</h3>
          <p className={`mt-1 ${titleBold ? "font-semibold" : "font-normal"}`} style={{ fontSize: `${titleSize}px`, color: textColor }}>
            {profile.title || "Your Title"}
          </p>
          {profile.location && (
            <p className="mt-1.5 flex items-center justify-center gap-1" style={{ color: textColor, fontSize: `${Math.max(11, titleSize - 2)}px` }}>
              <MapPin className="w-3 h-3" /> {profile.location}
            </p>
          )}
          {profile.bio && (
            <p className={`mt-4 leading-relaxed ${bioBold ? "font-semibold" : "font-normal"}`} style={{ fontSize: `${bioSize}px`, color: textColor }}>{profile.bio}</p>
          )}
        </div>
      );
    }

    if (section === "contact") {
      return (
        <div key="contact" className="grid grid-cols-4 gap-3 mt-6">
          {contactActionOrder.map((actionId) => {
            const action = actionLookup[actionId];
            if (!action) {
              return null;
            }
            if (enabledContactActions && enabledContactActions[actionId] === false) {
              return null;
            }
            if (!action.show) {
              return null;
            }

            const Icon = action.icon;
            return (
              <a
                key={actionId}
                href={actionId === "website" ? toExternalUrl(profile.website || "") : actionId === "phone" ? `tel:${profile.phone || ""}` : actionId === "email" ? `mailto:${profile.email || ""}` : actionId === "whatsapp" ? `https://wa.me/${profile.whatsapp || ""}` : "#"}
                target={actionId === "website" || actionId === "whatsapp" ? "_blank" : undefined}
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary transition-all"
                style={{ backgroundColor: "rgba(148,163,184,0.15)", color: textColor }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = actionHoverColor;
                  event.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "rgba(148,163,184,0.15)";
                  event.currentTarget.style.color = textColor;
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium capitalize">{actionId}</span>
              </a>
            );
          })}
        </div>
      );
    }

    if (section === "social") {
      return (
        <div key="social" className="mt-4 space-y-2">
          {socialLinks.map((link) => {
            const Icon = socialIconLookup[link.platform] || Globe;
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
      );
    }

    return null;
  };

  return (
  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
    <div className="h-44 relative overflow-hidden" style={{ background: profile.coverColor || "hsl(var(--primary))" }}>
      {profile.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${profile.backgroundImageUrl})`,
            filter: `blur(${profile.backgroundBlurStrength || 0}px)`,
            transform: profile.backgroundBlurStrength ? "scale(1.08)" : "none",
          }}
        />
      )}
      {profile.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: Math.max(0, Math.min(80, profile.backgroundOverlayOpacity || 0)) / 100 }}
        />
      )}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <div className="rounded-full border-4 border-card bg-muted overflow-hidden shadow-lg" style={{ width: `${photoSize}px`, height: `${photoSize}px`, transform: `translateY(${photoOffsetY}px)` }}>
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent text-accent-foreground font-heading font-bold text-xl">
              {profile.name?.charAt(0) || "U"}
            </div>
          )}
        </div>
      </div>
    </div>

    <div
      className="px-6 pb-10 pt-4 text-center"
      style={{
        color: textColor,
        backgroundColor: profile.bodyBackgroundColor || "#ffffff",
        backgroundImage: profile.bodyBackgroundImageUrl ? `url(${profile.bodyBackgroundImageUrl})` : undefined,
        backgroundSize: profile.bodyBackgroundImageUrl ? "cover" : undefined,
        backgroundPosition: profile.bodyBackgroundImageUrl ? "center" : undefined,
      }}
    >
      {layoutMode === "freeform" ? (
        <div className="relative h-[260px] rounded-lg border border-dashed border-border/70 bg-background/15">
          {sectionOrder.map((section) => {
            const position = resolvedPositions[section] || { x: 0, y: 0 };
            return (
              <motion.div
                key={section}
                className="absolute left-0 right-0 px-2"
                style={{ x: position.x, y: position.y }}
                drag={editableLayout}
                dragMomentum={false}
                dragElastic={0.06}
                dragConstraints={{ left: -80, right: 80, top: -10, bottom: 220 }}
                onDragEnd={(_, info) => {
                  if (!editableLayout || !onSectionPositionChange) {
                    return;
                  }
                  onSectionPositionChange(section, {
                    x: Math.round(position.x + info.offset.x),
                    y: Math.round(position.y + info.offset.y),
                  });
                }}
              >
                {editableLayout && (
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Drag {section}</p>
                )}
                {renderSection(section)}
              </motion.div>
            );
          })}
        </div>
      ) : (
        sectionOrder.map((section) => renderSection(section))
      )}

      <div className="mt-6">
        <Button className={`w-full h-12 ${resolvedButton} bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold`}>
          <Download className="w-4 h-4 mr-2" /> Save Contact
        </Button>
        {showExchangeContact && (
          <div className={`w-full mt-2 py-2.5 ${resolvedButton} border border-border text-xs font-medium flex items-center justify-center gap-1.5`} style={{ color: textColor }}>
            <Link2 className="w-3 h-3" /> Exchange Contact
          </div>
        )}
      </div>

      <p className="text-[9px] text-muted-foreground mt-8">Powered by NexTap</p>
    </div>
  </div>
);
};

export default MiniProfileCard;
