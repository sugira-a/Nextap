import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import {
  Save, RotateCcw, Phone, MessageCircle, Mail, Smartphone, Monitor, 
  CreditCard, Eye, Palette, User, Link2, Sparkles, Upload, Plus, 
  Trash2, ChevronRight, Check, FileText
} from "lucide-react";

interface ProfileData {
  avatar: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  linkedin: string;
  instagram: string;
  services: string[];
  aboutTitle: string;
  aboutText: string;
  bgStyle: "minimal-dark" | "minimal-light" | "gradient";
  accentColor: "green" | "blue" | "purple";
  buttonStyle: "rounded-full" | "rounded-lg" | "rounded-none";
}

type PreviewMode = "mobile" | "desktop" | "card" | "minimal";

const colorSchemes = {
  green: { accent: "#10b981", light: "#ecfdf5", dark: "#064e3b" },
  blue: { accent: "#3b82f6", light: "#eff6ff", dark: "#1e3a8a" },
  purple: { accent: "#a855f7", light: "#faf5ff", dark: "#581c87" },
};

const defaultProfile: ProfileData = {
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
  name: "Alex Johnson",
  title: "Creative Director",
  company: "NexTap",
  bio: "Passionate about design and innovation. Building the future of digital networking.",
  email: "alex@nextap.com",
  phone: "+1 (555) 123-4567",
  whatsapp: "+1 (555) 123-4567",
  website: "https://alexjohnson.com",
  linkedin: "https://linkedin.com/in/alexjohnson",
  instagram: "@alexjohnson",
  services: ["Design Consulting", "Brand Strategy", "Web Design"],
  aboutTitle: "About Me",
  aboutText: "I'm a creative director with 8+ years of experience helping brands stand out. I specialize in digital design, branding, and user experience.",
  bgStyle: "minimal-light",
  accentColor: "green",
  buttonStyle: "rounded-full",
};

// Preview Component - Mobile NFC Profile
const MobileProfilePreview = ({ profile, colorScheme }: any) => {
  const bgMap = {
    "minimal-dark": "#ffffff",
    "minimal-light": "#f9fafb",
    "gradient": `linear-gradient(135deg, ${colorScheme.light} 0%, #ffffff 100%)`,
  };

  return (
    <div
      className="w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl"
      style={{ background: bgMap[profile.bgStyle] }}
    >
      {/* Header Accent */}
      <div
        className="h-32 flex items-end justify-center pb-4"
        style={{ background: `linear-gradient(135deg, ${colorScheme.accent} 0%, ${colorScheme.dark} 100%)` }}
      />

      {/* Main Content - Negative Margin for Avatar */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="flex justify-center -mt-12 mb-6">
          <div
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white"
            style={{ borderColor: "white" }}
          >
            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Name & Title */}
        <h1 className="text-2xl font-heading font-bold text-center text-slate-900 leading-tight break-words max-w-full">{profile.name}</h1>
        <p className="text-sm text-center text-slate-600 mt-1 font-medium truncate">{profile.title}</p>
        <p className="text-xs text-center text-slate-500 mt-0.5 truncate">{profile.company}</p>

        {/* Bio */}
        <p className="text-sm text-center text-slate-700 mt-4 leading-relaxed">{profile.bio}</p>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <button
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all hover:shadow-md ${profile.buttonStyle}`}
            style={{ background: colorScheme.light, color: colorScheme.accent }}
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs font-medium">Call</span>
          </button>
          <button
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all hover:shadow-md ${profile.buttonStyle}`}
            style={{ background: colorScheme.light, color: colorScheme.accent }}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">Message</span>
          </button>
          <button
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all hover:shadow-md ${profile.buttonStyle}`}
            style={{ background: colorScheme.light, color: colorScheme.accent }}
          >
            <Mail className="w-5 h-5" />
            <span className="text-xs font-medium">Email</span>
          </button>
        </div>

        {/* About Section */}
        {profile.aboutText && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2 text-sm">{profile.aboutTitle}</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{profile.aboutText}</p>
          </div>
        )}

        {/* Services */}
        {profile.services.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Services</h3>
            <div className="flex flex-wrap gap-2">
              {profile.services.map((service, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-xs font-medium rounded-full"
                  style={{ background: colorScheme.light, color: colorScheme.accent }}
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {(profile.website || profile.linkedin || profile.instagram) && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
            {profile.website && (
              <a href={profile.website} className="flex items-center text-sm text-slate-700 hover:text-slate-900">
                <span className="inline-block w-4 h-4 mr-3 opacity-60">🌐</span>
                Website
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} className="flex items-center text-sm text-slate-700 hover:text-slate-900">
                <span className="inline-block w-4 h-4 mr-3 opacity-60">in</span>
                LinkedIn
              </a>
            )}
            {profile.instagram && (
              <a href={`https://instagram.com/${profile.instagram}`} className="flex items-center text-sm text-slate-700 hover:text-slate-900">
                <span className="inline-block w-4 h-4 mr-3 opacity-60">📷</span>
                Instagram
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Minimal Card Preview (Compact)
const CardPreview = ({ profile, colorScheme }: any) => (
  <div
    className="w-full max-w-[420px] rounded-2xl p-5 shadow-lg flex gap-4"
    style={{ background: colorScheme.light }}
  >
    <img 
      src={profile.avatar} 
      alt={profile.name} 
      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-slate-900 truncate">{profile.name}</h3>
      <p className="text-xs text-slate-600">{profile.title}</p>
      <div className="flex gap-2 mt-2">
        <button className="text-xs px-3 py-1 rounded-full bg-white text-slate-700 hover:bg-slate-50">
          Contact
        </button>
        <button className="text-xs px-3 py-1 rounded-full bg-white text-slate-700 hover:bg-slate-50">
          View
        </button>
      </div>
    </div>
  </div>
);

// Main Studio Component
const ProfileStudioCreative = () => {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("mobile");
  const [hasChanges, setHasChanges] = useState(false);
  const colorScheme = colorSchemes[profile.accentColor];

  const handleUpdate = (key: keyof ProfileData, value: any) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleAddService = () => {
    setProfile((prev) => ({
      ...prev,
      services: [...prev.services, "New Service"],
    }));
    setHasChanges(true);
  };

  const handleRemoveService = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Authentication required", { duration: 2000 });
        return;
      }

      await apiRequest("/api/profile/me/update", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile.name,
          title: profile.title,
          bio: profile.bio,
          email_public: profile.email,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          website: profile.website,
          linkedin_url: profile.linkedin,
          twitter_url: profile.twitter,
          instagram_url: profile.instagram,
          company_name: profile.company,
        }),
      });

      toast.success("Profile saved successfully!", { duration: 2000 });
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to save profile", { duration: 2000 });
    }
  };

  const handleReset = () => {
    setProfile(defaultProfile);
    setHasChanges(false);
    toast.success("Changes discarded", { duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-slate-700">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">Profile Designer</h1>
              <p className="text-xs text-slate-400 mt-1">Create a stunning NFC digital profile</p>
            </div>
            <div className="flex gap-3">
              {hasChanges && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset} className="border-slate-600">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Preview Mode Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-white text-sm">Preview Mode</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "mobile", label: "Mobile", icon: Smartphone },
                  { id: "card", label: "Card", icon: CreditCard },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPreviewMode(mode.id as PreviewMode)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      previewMode === mode.id
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    <mode.icon className="w-4 h-4 inline mr-1" />
                    {mode.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Design Controls */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-white text-sm">Design</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-slate-300 mb-2 block">Accent Color</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(colorSchemes).map(([key, scheme]) => (
                      <button
                        key={key}
                        onClick={() => handleUpdate("accentColor", key as any)}
                        className={`h-10 rounded-lg transition-all ring-2 ${
                          profile.accentColor === key ? "ring-white" : "ring-transparent opacity-60"
                        }`}
                        style={{ background: scheme.accent }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-300 mb-2 block">Background</Label>
                  <select
                    value={profile.bgStyle}
                    onChange={(e) => handleUpdate("bgStyle", e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white"
                  >
                    <option value="minimal-light">Light</option>
                    <option value="minimal-dark">Dark</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-300 mb-2 block">Button Style</Label>
                  <select
                    value={profile.buttonStyle}
                    onChange={(e) => handleUpdate("buttonStyle", e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white"
                  >
                    <option value="rounded-full">Pill</option>
                    <option value="rounded-lg">Rounded</option>
                    <option value="rounded-none">Square</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Profile Info Tab */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden"
            >
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full rounded-none border-b border-slate-700 bg-slate-700/50">
                  <TabsTrigger value="basic" className="flex-1 rounded-none text-xs">
                    <User className="w-3 h-3 mr-1" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="links" className="flex-1 rounded-none text-xs">
                    <Link2 className="w-3 h-3 mr-1" />
                    Links
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex-1 rounded-none text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Content
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-300">Full Name</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => handleUpdate("name", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-300">Title</Label>
                    <Input
                      value={profile.title}
                      onChange={(e) => handleUpdate("title", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-300">Company</Label>
                    <Input
                      value={profile.company}
                      onChange={(e) => handleUpdate("company", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-300">Bio</Label>
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => handleUpdate("bio", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs resize-none"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="links" className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-300">Email</Label>
                    <Input
                      value={profile.email}
                      onChange={(e) => handleUpdate("email", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs h-8"
                      type="email"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-300">Phone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => handleUpdate("phone", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs h-8"
                      type="tel"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-300">WhatsApp</Label>
                    <Input
                      value={profile.whatsapp}
                      onChange={(e) => handleUpdate("whatsapp", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-300">Website</Label>
                    <Input
                      value={profile.website}
                      onChange={(e) => handleUpdate("website", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs h-8"
                      placeholder="https://..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="content" className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-300">About Title</Label>
                    <Input
                      value={profile.aboutTitle}
                      onChange={(e) => handleUpdate("aboutTitle", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-300">About Text</Label>
                    <Textarea
                      value={profile.aboutText}
                      onChange={(e) => handleUpdate("aboutText", e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-xs resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium text-slate-300">Services</Label>
                      <button
                        onClick={handleAddService}
                        className="text-green-500 hover:text-green-400 text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {profile.services.map((service, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={service}
                            onChange={(e) => {
                              const newServices = [...profile.services];
                              newServices[i] = e.target.value;
                              handleUpdate("services", newServices);
                            }}
                            className="bg-slate-700 border-slate-600 text-white text-xs h-7"
                          />
                          <button
                            onClick={() => handleRemoveService(i)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="lg:col-span-2">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="lg:sticky lg:top-24 bg-slate-800/30 backdrop-blur rounded-2xl border border-slate-700 p-6 sm:p-8 flex flex-col items-center justify-center lg:min-h-[700px] min-h-0"
              >
              <div className="text-center mb-8">
                <Sparkles className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                <p className="text-xs text-slate-400 mt-1">Changes appear instantly</p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={previewMode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex justify-center"
                >
                  {previewMode === "mobile" && (
                    <MobileProfilePreview profile={profile} colorScheme={colorScheme} />
                  )}
                  {previewMode === "card" && (
                    <CardPreview profile={profile} colorScheme={colorScheme} />
                  )}
                </motion.div>
              </AnimatePresence>

              <p className="text-xs text-slate-500 mt-8">All changes save automatically</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileStudioCreative;
