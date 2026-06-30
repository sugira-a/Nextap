import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Camera, Loader2, Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfilePreview from "@/components/ProfilePreview";

interface ProfileData {
  photo_url: string;
  title: string;
  bio: string;
  phone: string;
  whatsapp: string;
  email_public: string;
  website: string;
  location: string;
  linkedin_url: string;
  twitter_url: string;
  instagram_url: string;
  cover_color?: string;
  bg_image_url?: string;
}

const ProfileSetup = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [bgPreview, setBgPreview] = useState<string>("");
  const [userData, setUserData] = useState<any>(null);

  const [formData, setFormData] = useState<ProfileData>({
    photo_url: "",
    title: "",
    bio: "",
    phone: "",
    whatsapp: "",
    email_public: "",
    website: "",
    location: "",
    linkedin_url: "",
    twitter_url: "",
    instagram_url: "",
    cover_color: "#10b981",
    bg_image_url: "",
  });

  // Fetch current user and profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await apiRequest<any>("/api/auth/me");
        setUserData(userResponse);
        
        // Fetch existing profile data if it exists
        try {
          const profileResponse = await apiRequest<any>("/api/profile/me");
          if (profileResponse.profile) {
            // Ensure all values are strings (not null/undefined) to prevent controlled/uncontrolled input warnings
            const profileData = {
              photo_url: profileResponse.profile.photo_url || "",
              title: profileResponse.profile.title || "",
              bio: profileResponse.profile.bio || "",
              phone: profileResponse.profile.phone || "",
              whatsapp: profileResponse.profile.whatsapp || "",
              email_public: profileResponse.profile.email_public || "",
              website: profileResponse.profile.website || "",
              location: profileResponse.profile.location || "",
              linkedin_url: profileResponse.profile.linkedin_url || "",
              twitter_url: profileResponse.profile.twitter_url || "",
              instagram_url: profileResponse.profile.instagram_url || "",
              cover_color: profileResponse.profile.cover_color || "#10b981",
              bg_image_url: profileResponse.profile.bg_image_url || "",
            };
            setFormData(profileData);
            if (profileData.photo_url) {
              setImagePreview(profileData.photo_url);
            }
            if (profileData.bg_image_url) {
              setBgPreview(profileData.bg_image_url);
            }
          }
        } catch {
          // Profile might not exist yet, that's okay
        }
      } catch (error) {
        toast.error("Failed to load user data");
        navigate("/dashboard");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, photo_url: base64 }));
        setImagePreview(base64);
        toast.success("Photo uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, bg_image_url: base64 }));
        setBgPreview(base64);
        toast.success("Background image uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, cover_color: e.target.value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Generate public_slug from first and last name if not already set
      const publicSlug = `${userData.first_name || 'user'}_${userData.last_name || 'profile'}`.toLowerCase().replace(/\s+/g, '_');
      
      // Send all data including base64 images
      const dataToSend = {
        ...formData,
        public_slug: publicSlug,
        // Send the base64 images as-is - backend will handle storage
        photo_url: formData.photo_url || "",
        bg_image_url: formData.bg_image_url || "",
      };
      
      const response = await apiRequest("/api/profile/me/update", {
        method: "PUT",
        body: JSON.stringify(dataToSend),
      });
      
      toast.success("Profile created successfully!");
      navigate("/dashboard");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to save profile";
      toast.error(errorMsg);
      console.error("Profile save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Create minimal profile and skip to dashboard
    // Even if this fails, allow navigation to dashboard
    setLoading(true);
    try {
      const publicSlug = `${userData.first_name || 'user'}_${userData.last_name || 'profile'}`.toLowerCase().replace(/\s+/g, '_');
      const dataToSend = {
        public_slug: publicSlug,
        title: "",
        bio: "",
        phone: "",
        whatsapp: "",
        email_public: "",
        website: "",
        location: "",
        linkedin_url: "",
        twitter_url: "",
        instagram_url: "",
        cover_color: "#10b981",
        bg_image_url: "",
      };
      
      try {
        await apiRequest("/api/profile/me/update", {
          method: "PUT",
          body: JSON.stringify(dataToSend),
        });
        toast.success("Profile created! You can edit it anytime.");
      } catch (apiError) {
        // Profile creation failed, but allow navigation anyway
        console.warn("Profile creation failed during skip:", apiError);
        toast.info("Skipping profile setup...");
      }
      
      // Navigate to dashboard regardless of profile creation success
      navigate("/dashboard");
    } catch (error) {
      console.error("Skip error:", error);
      // Force navigation to dashboard
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const progressSteps = ["Photo & Basic", "Bio & Location", "Socials", "Review"];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar dark={false} />

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              {progressSteps.map((label, i) => (
                <div key={i} className="flex-1">
                  <div className="text-xs md:text-sm font-medium text-slate-600 mb-2 text-center">
                    {label}
                  </div>
                  <div
                    className={`h-1 rounded-full transition-colors ${
                      i < step ? "bg-emerald-500" : i === step - 1 ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Form Section */}
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
                {step === 1 && "Add Your Photo"}
                {step === 2 && "Tell Us About Yourself"}
                {step === 3 && "Connect Your Socials"}
                {step === 4 && "Review Your Profile"}
              </h2>

              {/* Step 1: Photo & Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Profile Photo
                    </label>
                    <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center">
                          <Camera className="w-12 h-12 text-emerald-300" />
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-colors cursor-pointer flex items-center justify-center"
                      >
                        <span className="text-xs font-medium text-emerald-600 bg-white px-2 py-1 rounded">Click to upload</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-3">Or drag and drop your image</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Professional Title/Job
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Product Designer"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email (Public)
                    </label>
                    <input
                      type="email"
                      name="email_public"
                      value={formData.email_public}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div className="border-t pt-6">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-700 mb-4">
                      <Palette className="w-5 h-5 text-emerald-600" />
                      Customize Your Card
                    </label>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Header Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={formData.cover_color || "#10b981"}
                            onChange={handleColorChange}
                            className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200"
                          />
                          <input
                            type="text"
                            value={formData.cover_color || "#10b981"}
                            onChange={handleColorChange}
                            placeholder="#10b981"
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Background Image (Optional)
                        </label>
                        <div className="relative">
                          {bgPreview && (
                            <div className="mb-2">
                              <img
                                src={bgPreview}
                                alt="Background preview"
                                className="w-full h-24 object-cover rounded-lg border border-slate-200"
                              />
                            </div>
                          )}
                          <input
                            ref={bgInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBgImageChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => bgInputRef.current?.click()}
                            className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors text-slate-700 font-medium"
                          >
                            {bgPreview ? "Change background" : "Upload background image"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Bio & Location */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bio / About
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell people about yourself, your expertise, and what you do..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">{formData.bio.length}/500 characters</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://yoursite.com"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Socials */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      LinkedIn
                    </label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-3">linkedin.com/in/</span>
                      <input
                        type="text"
                        name="linkedin_url"
                        value={(formData.linkedin_url || "").replace("https://linkedin.com/in/", "")}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value ? `https://linkedin.com/in/${e.target.value}` : "" }))}
                        placeholder="yourprofile"
                        className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Twitter / X
                    </label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-3">twitter.com/</span>
                      <input
                        type="text"
                        name="twitter_url"
                        value={(formData.twitter_url || "").replace("https://twitter.com/", "")}
                        onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value ? `https://twitter.com/${e.target.value}` : "" }))}
                        placeholder="yourhandle"
                        className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Instagram
                    </label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-3">instagram.com/</span>
                      <input
                        type="text"
                        name="instagram_url"
                        value={(formData.instagram_url || "").replace("https://instagram.com/", "")}
                        onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value ? `https://instagram.com/${e.target.value}` : "" }))}
                        placeholder="yourprofile"
                        className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-600">💡 Tip: You can update these anytime from your dashboard</p>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-emerald-900">Profile Complete!</h3>
                        <p className="text-sm text-emerald-700 mt-1">Your profile is ready to go. You can always edit it later in your dashboard.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {formData.photo_url && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Photo</p>
                        <img src={imagePreview} alt="Profile" className="w-20 h-20 rounded-lg object-cover mt-1" />
                      </div>
                    )}
                    {formData.title && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Title</p>
                        <p className="text-slate-900 font-medium">{formData.title}</p>
                      </div>
                    )}
                    {formData.bio && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Bio</p>
                        <p className="text-slate-700 text-sm">{formData.bio}</p>
                      </div>
                    )}
                    {formData.location && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Location</p>
                        <p className="text-slate-700">{formData.location}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
                <Button
                  onClick={() => step > 1 ? setStep(step - 1) : handleSkip()}
                  variant="outline"
                  className="flex-1"
                >
                  {step === 1 ? "Skip for now" : "Back"}
                </Button>
                <Button
                  onClick={() => step < 4 ? setStep(step + 1) : handleSaveProfile()}
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : step === 4 ? (
                    "Create Profile"
                  ) : (
                    "Next"
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden md:block"
            >
              <div className="sticky top-20">
                <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Preview</h3>
                <ProfilePreview
                  firstName={userData.first_name}
                  lastName={userData.last_name}
                  formData={formData}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer dark={false} />
    </div>
  );
};

export default ProfileSetup;
