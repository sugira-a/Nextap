import { Phone, Mail, Globe, MessageCircle, Linkedin, Twitter, Instagram, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

interface ProfileCardPreviewProps {
  profile: ProfileData;
  compact?: boolean;
}

const ProfileCardPreview = ({ profile, compact = false }: ProfileCardPreviewProps) => {
  const handleSaveContact = () => {
    // Build comprehensive vCard with all contact details
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${profile.name}`,
      `N:${profile.name.split(" ").pop() || ""};;${profile.name.split(" ").slice(0, -1).join(" ")};;`,
      // Organization/Company
      profile.company ? `ORG:${profile.company}` : "",
      profile.title ? `TITLE:${profile.title}` : "",
      // Phone numbers
      profile.phone ? `TEL;TYPE=CELL:${profile.phone}` : "",
      profile.whatsapp ? `TEL;TYPE=CELL:${profile.whatsapp}` : "",
      // Email
      profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : "",
      // Website/URL
      profile.website ? `URL:${profile.website.startsWith("http") ? profile.website : "https://" + profile.website}` : "",
      // Bio/Note
      profile.bio ? `NOTE:${profile.bio.replace(/\n/g, "\\n")}` : "",
      // Social profiles
      profile.linkedin ? `X-SOCIALPROFILE;type=linkedin:${profile.linkedin}` : "",
      profile.twitter ? `X-SOCIALPROFILE;type=twitter:${profile.twitter}` : "",
      profile.instagram ? `X-SOCIALPROFILE;type=instagram:${profile.instagram}` : "",
      // Photo/Avatar
      profile.avatar ? `PHOTO;VALUE=URI:${profile.avatar}` : "",
      // Revision timestamp
      `REV:${new Date().toISOString()}`,
      // Unique identifier
      `UID:${profile.name.replace(/\s/g, "_")}-${Date.now()}@nextap`,
      "END:VCARD",
    ].filter(Boolean).join("\r\n");
    
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden shadow-sm ${compact ? 'max-w-xs' : 'max-w-sm'} mx-auto`}>
      <div className="bg-primary h-20 relative" />
      <div className="px-6 pb-6 -mt-10 text-center">
        <div className="w-20 h-20 rounded-full border-4 border-card bg-muted mx-auto mb-4 overflow-hidden">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent text-accent-foreground font-heading font-bold text-2xl">
              {profile.name?.charAt(0) || "U"}
            </div>
          )}
        </div>
        <h3 className="font-heading font-bold text-lg text-foreground">{profile.name || "Your Name"}</h3>
        <p className="text-sm text-muted-foreground">{profile.title || "Your Title"}{profile.company ? ` at ${profile.company}` : ""}</p>
        {profile.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>}

        <div className="flex justify-center gap-3 mt-4">
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
              <Phone className="w-4 h-4" />
            </a>
          )}
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
              <Mail className="w-4 h-4" />
            </a>
          )}
          {profile.whatsapp && (
            <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
              <Globe className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="flex justify-center gap-3 mt-3">
          {profile.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          {profile.twitter && (
            <a href={profile.twitter} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {profile.instagram && (
            <a href={profile.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
          )}
        </div>

        <Button onClick={handleSaveContact} className="w-full mt-5 bg-accent text-accent-foreground hover:bg-accent/90">
          <Download className="w-4 h-4 mr-2" />
          Save Contact
        </Button>
      </div>
    </div>
  );
};

export default ProfileCardPreview;
