import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

const Links = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      const response = await apiRequest<{ profile: any }>("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setLinks([
        { id: "website", platform: "Website", url: response.profile?.website || "" },
        { id: "linkedin", platform: "LinkedIn", url: response.profile?.linkedin_url || "" },
        { id: "twitter", platform: "Twitter", url: response.profile?.twitter_url || "" },
        { id: "instagram", platform: "Instagram", url: response.profile?.instagram_url || "" },
      ]);
    };

    load().catch(() => toast.error("Failed to load links"));
  }, []);

  const addLink = () => setLinks([...links, { id: Date.now().toString(), platform: "", url: "" }]);
  const removeLink = (id: string) => setLinks(links.filter(l => l.id !== id));
  const updateLink = (id: string, field: string, value: string) =>
    setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("access_token");
      const map = Object.fromEntries(links.map((link) => [link.platform.toLowerCase(), link.url]));

      await apiRequest("/api/profile/me/update", {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({
          public_slug: (await apiRequest<{ profile: { public_slug: string } }>("/api/auth/me", { headers: token ? { Authorization: `Bearer ${token}` } : {} })).profile.public_slug,
          website: map.website || "",
          linkedin_url: map.linkedin || "",
          twitter_url: map.twitter || "",
          instagram_url: map.instagram || "",
        }),
      });

      toast.success("Links saved");
    } catch {
      toast.error("Failed to save links");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Links</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your social and website links</p>
        </div>
        <Button onClick={addLink} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Add Link</Button>
      </div>

      <div className="space-y-3">
        {links.map(link => (
          <div key={link.id} className="bg-card border border-border rounded-xl p-4 flex items-end gap-4">
            <div className="flex-1">
              <Label>Platform</Label>
              <Input value={link.platform} onChange={e => updateLink(link.id, "platform", e.target.value)} className="mt-1.5" placeholder="e.g. LinkedIn" />
            </div>
            <div className="flex-[2]">
              <Label>URL</Label>
              <Input value={link.url} onChange={e => updateLink(link.id, "url", e.target.value)} className="mt-1.5" placeholder="https://..." />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeLink(link.id)} className="text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {links.length === 0 && (
          <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No links yet. Add your first social link.</p>
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">{saving ? "Saving..." : "Save Links"}</Button>
    </motion.div>
  );
};

export default Links;