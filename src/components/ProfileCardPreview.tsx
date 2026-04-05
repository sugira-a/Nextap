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
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${profile.name}\nTITLE:${profile.title}\nORG:${profile.company}\nTEL:${profile.phone || ''}\nEMAIL:${profile.email || ''}\nURL:${profile.website || ''}\nNOTE:${profile.bio}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s/g, '_')}.vcf`;
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
