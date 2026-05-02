import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, Check, Search, Loader } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

export type ProfileData = {
  companyName: string;
  companyWebsite: string;
  companyPhone: string;
  companyLocation: string;
  companyLogo: string;
  firstName: string;
  lastName: string;
  title: string;
  position: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  location: string;
  profilePhoto: string;
};

interface ProfileDataFormProps {
  data: ProfileData;
  onUpdate: (data: ProfileData) => void;
  onAutoFill: () => void;
  isLoading?: boolean;
}

// Required fields for auto-fill (minimum 50% to enable auto-fill button)
const REQUIRED_FIELDS = ["firstName", "lastName", "title", "email", "phone", "profilePhoto"] as const;

export const ProfileDataForm: React.FC<ProfileDataFormProps> = ({
  data,
  onUpdate,
  onAutoFill,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState(data.profilePhoto);
  const [logoPreview, setLogoPreview] = useState(data.companyLogo);
  
  // Employee search states
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeResults, setEmployeeResults] = useState<any[]>([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [showEmployeeResults, setShowEmployeeResults] = useState(false);

  const completedItems = REQUIRED_FIELDS.filter((item) => data[item as keyof ProfileData]).length;
  const completionPercent = Math.round((completedItems / REQUIRED_FIELDS.length) * 100);

  const handleInputChange = (key: keyof ProfileData, value: string) => {
    onUpdate({ ...data, [key]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPhotoPreview(dataUrl);
      handleInputChange("profilePhoto", dataUrl);
      toast.success("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Logo must be under 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      handleInputChange("companyLogo", dataUrl);
      toast.success("Company logo updated!");
    };
    reader.readAsDataURL(file);
  };

  const searchEmployees = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setEmployeeResults([]);
      setShowEmployeeResults(false);
      return;
    }

    setSearchingEmployees(true);
    try {
      const companyId = await getCurrentCompanyId();
      if (!companyId) {
        return;
      }

      const response = await apiRequest<{ data: any[] }>(`/api/company/${companyId}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });

      const filtered = (response.data || []).filter((emp) => {
        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
        const email = (emp.email || "").toLowerCase();
        const search = searchQuery.toLowerCase();
        return fullName.includes(search) || email.includes(search);
      });

      setEmployeeResults(filtered.slice(0, 10)); // Limit to 10 results
      setShowEmployeeResults(true);
    } catch (error) {
      toast.error("Failed to search employees");
    } finally {
      setSearchingEmployees(false);
    }
  };

  const selectEmployee = (emp: any) => {
    onUpdate({
      ...data,
      firstName: emp.first_name || "",
      lastName: emp.last_name || "",
      email: emp.email || "",
      phone: emp.phone || data.phone,
      title: emp.title || data.title,
      position: emp.title || data.position,
    });
    setEmployeeSearch("");
    setShowEmployeeResults(false);
  };

  return (
    <div className="space-y-2.5">
      {/* Employee Search - Main Feature */}
      <div className="space-y-1.5 relative">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Find & Fill Profile</p>
        <input
          type="text"
          value={employeeSearch}
          onChange={(e) => {
            setEmployeeSearch(e.target.value);
            searchEmployees(e.target.value);
          }}
          placeholder="Search employee name or email..."
          className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all"
        />

        {showEmployeeResults && employeeResults.length > 0 && (
          <div className="absolute top-9 left-0 right-0 z-50 bg-white/10 backdrop-blur border border-white/20 rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto">
            {employeeResults.map((emp) => (
              <button
                key={emp.id}
                onClick={() => selectEmployee(emp)}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
              >
                <div className="font-medium text-white leading-tight">{emp.first_name} {emp.last_name}</div>
                <div className="text-slate-400 text-[8px] leading-tight">{emp.email}</div>
              </button>
            ))}
          </div>
        )}

        {showEmployeeResults && employeeResults.length === 0 && employeeSearch && !searchingEmployees && (
          <div className="absolute top-9 left-0 right-0 z-50 bg-white/10 backdrop-blur border border-white/20 rounded-lg p-2 text-xs text-slate-400 text-center">
            No employees found
          </div>
        )}
      </div>

      {/* Name Fields - Manual Entry */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            placeholder="First Name"
            className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
          />
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            placeholder="Last Name"
            className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
          />
        </div>
        <input
          type="text"
          value={data.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="Email"
          className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
        />
      </div>

      {/* Photo & Logo Upload - Compact */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Media</p>
        <div className="grid grid-cols-2 gap-2">
          {/* Profile Photo */}
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-20 rounded-lg border-2 border-dashed border-white/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group overflow-hidden"
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <Upload className="w-4 h-4 text-slate-500 mb-0.5" />
                  <span className="text-[8px] text-slate-500">Photo</span>
                </div>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>

          {/* Company Logo */}
          <div>
            <button
              onClick={() => logoInputRef.current?.click()}
              className="relative w-full h-20 rounded-lg border-2 border-dashed border-white/20 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group overflow-hidden bg-white/[0.03]"
            >
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1 bg-white/5" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <Upload className="w-4 h-4 text-slate-500 mb-0.5" />
                  <span className="text-[8px] text-slate-500">Logo</span>
                </div>
              )}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </div>
        </div>
      </div>

      {/* Additional Fields - Optional */}
      <div className="space-y-3 pt-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional Details</p>
        <input
          type="text"
          value={data.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Job Title"
          className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
        />
        <input
          type="text"
          value={data.position}
          onChange={(e) => handleInputChange("position", e.target.value)}
          placeholder="Position/Department"
          className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
        />
        <input
          type="text"
          value={data.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          placeholder="Phone"
          className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
        />
        <input
          type="text"
          value={data.website}
          onChange={(e) => handleInputChange("website", e.target.value)}
          placeholder="Website"
          className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
        />
      </div>

      {/* Auto-fill Button */}
      <button
        onClick={onAutoFill}
        disabled={isLoading}
        className="w-full py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-slate-500/10 text-blue-400 disabled:text-slate-500 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            Auto-filling...
          </>
        ) : (
          <>
            <Check className="w-3 h-3" />
            Auto-fill Template
          </>
        )}
      </button>
    </div>
  );
};
