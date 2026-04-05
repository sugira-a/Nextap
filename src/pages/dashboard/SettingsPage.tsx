import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

const SettingsPage = () => {
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      const data = await apiRequest<{ user: { email: string }; profile: { public_slug: string } | null }>("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setEmail(data.user.email);
      setSlug(data.profile?.public_slug || "");
    };

    load().catch(() => toast.error("Failed to load settings"));
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("access_token");
      await apiRequest("/api/profile/me/update", {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ public_slug: slug }),
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Delete your account permanently?")) return;

    try {
      const token = localStorage.getItem("access_token");
      await apiRequest("/api/auth/me", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      toast.success("Account deleted");
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete account");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5 max-w-lg">
        <div>
          <Label>Email</Label>
          <Input value={email} readOnly className="mt-1.5" />
        </div>
        <div>
          <Label>Username</Label>
          <Input value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1">Your profile will be at /u/{slug || "your-slug"}</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">{saving ? "Saving..." : "Save"}</Button>
      </div>

      <div className="bg-card border border-destructive/30 rounded-xl p-6 max-w-lg">
        <h2 className="font-heading font-semibold text-foreground">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mt-1">Permanently delete your account and all data.</p>
        <Button variant="outline" className="mt-4 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={deleteAccount}>Delete Account</Button>
      </div>
    </motion.div>
  );
};

export default SettingsPage;