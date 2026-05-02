import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

const themes = [
  { name: "Classic", cover: "#111111", button: "rounded-lg", font: "Modern" },
  { name: "Dark", cover: "#1F2937", button: "rounded-full", font: "Classic" },
  { name: "Green", cover: "#14532D", button: "rounded-none", font: "Modern" },
];

const Appearance = () => {
  const [coverColor, setCoverColor] = useState("#111111");
  const [buttonStyle, setButtonStyle] = useState("rounded-lg");
  const [fontStyle, setFontStyle] = useState("Modern");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      const response = await apiRequest<{ profile: any }>("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setCoverColor(response.profile?.cover_color || "#111111");
      setButtonStyle(response.profile?.button_style || "rounded-lg");
      setFontStyle(response.profile?.font_style || "Modern");
    };

    load().catch(() => toast.error("Failed to load appearance", { duration: 2000 }));
  }, []);

  const saveAppearance = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("access_token");
      const authMe = await apiRequest<{ profile: { public_slug: string } }>("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      await apiRequest("/api/profile/me/update", {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({
          public_slug: authMe.profile.public_slug,
          cover_color: coverColor,
          button_style: buttonStyle,
          font_style: fontStyle,
        }),
      });

      toast.success("Appearance saved", { duration: 2000 });
    } catch {
      toast.error("Failed to save appearance", { duration: 2000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Appearance</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize how your profile looks</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => {
              setCoverColor(theme.cover);
              setButtonStyle(theme.button);
              setFontStyle(theme.font);
              toast.success(`${theme.name} theme selected`, { duration: 2000 });
            }}
            className={`border-2 rounded-xl p-6 text-center hover:shadow-md transition-shadow ${
              coverColor === theme.cover ? "border-accent" : "border-border"
            }`}
          >
            <div className="w-8 h-8 rounded-full mx-auto mb-3" style={{ backgroundColor: theme.cover }} />
            <p className="text-sm font-medium text-foreground">{theme.name}</p>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-lg">
        <div>
          <label className="text-sm font-medium text-foreground">Cover Color</label>
          <input type="color" value={coverColor} onChange={(event) => setCoverColor(event.target.value)} className="mt-2 h-10 w-20 rounded border border-border" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Button Style</label>
          <select value={buttonStyle} onChange={(event) => setButtonStyle(event.target.value)} className="mt-2 w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="rounded-lg">Rounded</option>
            <option value="rounded-full">Pill</option>
            <option value="rounded-none">Square</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Font Style</label>
          <select value={fontStyle} onChange={(event) => setFontStyle(event.target.value)} className="mt-2 w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="Modern">Modern</option>
            <option value="Classic">Classic</option>
          </select>
        </div>
      </div>

      <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveAppearance} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
    </motion.div>
  );
};

export default Appearance;