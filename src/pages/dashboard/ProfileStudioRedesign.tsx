import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhoneMockup from "@/components/PhoneMockup";
import MiniProfileCard from "@/components/MiniProfileCard";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import {
  User, Palette, Image as ImageIcon, Sparkles, Save, RotateCcw,
  Upload, Plus, Trash2, Link2, Mail, Phone, MessageCircle, Globe,
  Linkedin, Twitter, Instagram, ChevronDown
} from "lucide-react";

const backgroundPresets = [
  { name: "Noir", value: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" },
  { name: "Emerald", value: "linear-gradient(135deg, #0d8c7e 0%, #10b981 100%)" },
  { name: "Ocean", value: "linear-gradient(135deg, #0369a1 0%, #06b6d4 100%)" },
  { name: "Sunset", value: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)" },
  { name: "Purple", value: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" },
  { name: "Slate", value: "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)" },
];

const templates = [
  { id: "executive", name: "Executive", bg: "linear-gradient(135deg, #0f172a 0%, #1a202c 100%)" },
  { id: "vibrant", name: "Vibrant", bg: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)" },
  { id: "minimal", name: "Minimal", bg: "linear-gradient(135deg, #f5f5f5 0%, #e5e7eb 100%)" },
  { id: "nature", name: "Nature", bg: "linear-gradient(135deg, #0d8c7e 0%, #10b981 100%)" },
];

interface ProfileData {
  avatar: string;
  name: string;
  title: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  company: string;
  coverColor: string;
  buttonStyle: string;
}

const ProfileStudioRedesign = () => {
  const [profile, setProfile] = useState<ProfileData>({
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=yvan",
    name: "yvan User",
    title: "CEO",
    bio: "New in this field professional. Experienced in 5yrs",
    location: "Kigali",
    email: "yu@example.com",
    phone: "+250 788 123 456",
    whatsapp: "+250 788 123 456",
    website: "https://example.com",
    linkedin: "https://linkedin.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    company: "NexTap",
    coverColor: "linear-gradient(135deg, #0f172a 0%, #1a202c 100%)",
    buttonStyle: "rounded-lg",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [template, setTemplate] = useState("executive");

  const handleUpdate = (key: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
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
          location: profile.location,
          email_public: profile.email,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          website: profile.website,
          linkedin_url: profile.linkedin,
          twitter_url: profile.twitter,
          instagram_url: profile.instagram,
          cover_color: profile.coverColor,
          button_style: profile.buttonStyle,
          company_name: profile.company,
        }),
      });

      toast.success("Profile saved successfully", { duration: 2000 });
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to save profile", { duration: 2000 });
    }
  };

  const handleReset = () => {
    toast.success("Changes discarded", { duration: 2000 });
    setHasChanges(false);
  };

  const applyTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setProfile((prev) => ({ ...prev, coverColor: tmpl.bg }));
      setTemplate(templateId);
      setHasChanges(true);
      toast.success(`${tmpl.name} template applied`, { duration: 2000 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">Profile Studio</h1>
            <p className="text-sm text-slate-500 mt-1">Design your professional digital card</p>
          </div>
          <div className="flex gap-3">
            {hasChanges && (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Discard
                </Button>
                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Publish Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Edit Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Templates */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-heading font-semibold text-slate-900">Templates</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t.id)}
                    className={`relative group overflow-hidden rounded-xl h-20 transition-all duration-200 ${
                      template === t.id ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
                    }`}
                    style={{ background: t.bg }}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    <span className="text-xs font-medium text-white/70 absolute bottom-2 left-2">{t.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Edit Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full rounded-none border-b border-slate-200 bg-slate-50">
                  <TabsTrigger value="profile" className="flex-1 rounded-none">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="design" className="flex-1 rounded-none">
                    <Palette className="w-4 h-4 mr-2" />
                    Design
                  </TabsTrigger>
                  <TabsTrigger value="links" className="flex-1 rounded-none">
                    <Link2 className="w-4 h-4 mr-2" />
                    Links
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="p-6 space-y-5">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => handleUpdate("name", e.target.value)}
                      className="mt-2"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Job Title</Label>
                    <Input
                      value={profile.title}
                      onChange={(e) => handleUpdate("title", e.target.value)}
                      className="mt-2"
                      placeholder="e.g., CEO, Designer"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Company</Label>
                    <Input
                      value={profile.company}
                      onChange={(e) => handleUpdate("company", e.target.value)}
                      className="mt-2"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Location</Label>
                    <Input
                      value={profile.location}
                      onChange={(e) => handleUpdate("location", e.target.value)}
                      className="mt-2"
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Bio</Label>
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => handleUpdate("bio", e.target.value)}
                      className="mt-2 resize-none"
                      rows={3}
                      placeholder="Tell people about yourself"
                    />
                  </div>
                </TabsContent>

                {/* Design Tab */}
                <TabsContent value="design" className="p-6 space-y-5">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">Background</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {backgroundPresets.map((bg) => (
                        <button
                          key={bg.name}
                          onClick={() => handleUpdate("coverColor", bg.value)}
                          className={`relative group rounded-lg h-16 overflow-hidden ring-2 transition-all ${
                            profile.coverColor === bg.value ? "ring-blue-500" : "ring-transparent hover:ring-slate-300"
                          }`}
                          style={{ background: bg.value }}
                        >
                          <span className="text-xs font-medium text-white/70 absolute bottom-1 left-2">{bg.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Button Style</Label>
                    <select
                      value={profile.buttonStyle}
                      onChange={(e) => handleUpdate("buttonStyle", e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="rounded-lg">Rounded</option>
                      <option value="rounded-full">Pill</option>
                      <option value="rounded-none">Sharp</option>
                    </select>
                  </div>
                </TabsContent>

                {/* Links Tab */}
                <TabsContent value="links" className="p-6 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Email</Label>
                    <Input
                      value={profile.email}
                      onChange={(e) => handleUpdate("email", e.target.value)}
                      className="mt-2"
                      type="email"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Phone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => handleUpdate("phone", e.target.value)}
                      className="mt-2"
                      type="tel"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Website</Label>
                    <Input
                      value={profile.website}
                      onChange={(e) => handleUpdate("website", e.target.value)}
                      className="mt-2"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">LinkedIn</Label>
                    <Input
                      value={profile.linkedin}
                      onChange={(e) => handleUpdate("linkedin", e.target.value)}
                      className="mt-2"
                      placeholder="https://linkedin.com/in/..."
                    />
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
              transition={{ delay: 0.2 }}
              className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-lg p-8 flex flex-col items-center justify-center min-h-[600px]"
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Live Preview</h3>
                <p className="text-sm text-slate-500 mt-1">See changes in real-time</p>
              </div>
              <div className="flex-1 flex items-center justify-center w-full">
                <PhoneMockup>
                  <MiniProfileCard profile={profile} />
                </PhoneMockup>
              </div>
              <p className="text-xs text-slate-400 mt-4">Changes will be saved automatically</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileStudioRedesign;
