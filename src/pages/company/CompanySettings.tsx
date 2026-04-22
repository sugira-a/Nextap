import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

const availableFields = ["title", "bio", "phone", "whatsapp", "email_public", "website", "location", "photo_url"];

const CompanySettings = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settings, setSettings] = useState({
    name: "",
    logo_url: "",
    primary_color: "#000000",
    accent_color: "#22C55E",
  });
  const [policySettings, setPolicySettings] = useState({
    required_fields: ["title", "photo_url"] as string[],
    editable_fields: availableFields as string[],
    approval_required: false,
    auto_approve: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const companyId = await getCurrentCompanyId();
        const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
        const [companyRes, policyRes] = await Promise.all([
          apiRequest<any>(`/api/company/${companyId}`, { headers }),
          apiRequest<any>(`/api/company/${companyId}/policy`, { headers }).catch(() => null),
        ]);
        const c = companyRes.company;
        setCompany(c);
        setSettings({ name: c.name, logo_url: c.logo_url || "", primary_color: c.primary_color, accent_color: c.accent_color });
        if (policyRes?.policy) {
          setPolicySettings({
            required_fields: policyRes.policy.required_fields || ["title", "photo_url"],
            editable_fields: policyRes.policy.editable_fields || availableFields,
            approval_required: policyRes.policy.approval_required,
            auto_approve: policyRes.policy.auto_approve,
          });
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveCompany = async () => {
    try {
      setSaving(true);
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify(settings),
      });
      toast.success("Company settings saved");
    } catch { toast.error("Error saving settings"); }
    finally { setSaving(false); }
  };

  const handleSavePolicy = async () => {
    try {
      setSaving(true);
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify(policySettings),
      });
      toast.success("Policy settings saved");
    } catch { toast.error("Error saving policy"); }
    finally { setSaving(false); }
  };

  const toggleField = (field: string, type: "required" | "editable") => {
    setPolicySettings(prev => ({
      ...prev,
      [type === "required" ? "required_fields" : "editable_fields"]: (
        type === "required" ? prev.required_fields : prev.editable_fields
      ).includes(field)
        ? (type === "required" ? prev.required_fields : prev.editable_fields).filter(f => f !== field)
        : [...(type === "required" ? prev.required_fields : prev.editable_fields), field],
    }));
  };

  const handleDelete = async () => {
    if (!company?.id) return;
    if (!window.confirm(`Delete workspace "${company.name}"? This action cannot be undone.`)) return;
    try {
      setDeleting(true);
      await apiRequest<any>(`/api/company/${company.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      toast.success("Workspace deleted");
      navigate("/login");
    } catch { toast.error("Failed to delete workspace"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-8 py-2"
    >
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Company</p>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">{company?.name} Â· /{company?.slug}</p>
      </div>

      {/* Company Information */}
      <section className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-zinc-900 mb-4">Company Information</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Company Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={e => setSettings({ ...settings, name: e.target.value })}
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Logo URL</label>
              <input
                type="url"
                value={settings.logo_url}
                onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
              />
              {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="mt-2 h-12 rounded-lg" />}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Primary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.primary_color} onChange={e => setSettings({ ...settings, primary_color: e.target.value })} className="h-10 w-14 rounded-lg border border-zinc-200 cursor-pointer" />
                  <span className="flex-1 border border-zinc-200 rounded-xl px-4 flex items-center text-sm font-mono text-zinc-500">{settings.primary_color}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Accent Color</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.accent_color} onChange={e => setSettings({ ...settings, accent_color: e.target.value })} className="h-10 w-14 rounded-lg border border-zinc-200 cursor-pointer" />
                  <span className="flex-1 border border-zinc-200 rounded-xl px-4 flex items-center text-sm font-mono text-zinc-500">{settings.accent_color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSaveCompany}
          disabled={saving}
          className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Savingâ€¦" : "Save Changes"}
        </button>
      </section>

      {/* Profile Policy */}
      <section className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
        <p className="text-sm font-semibold text-zinc-900">Profile Policy</p>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Required Fields</p>
            <div className="space-y-1">
              {availableFields.map(field => (
                <label key={field} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policySettings.required_fields.includes(field)}
                    onChange={() => toggleField(field, "required")}
                    className="w-4 h-4 accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-700 capitalize">{field.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Editable Fields</p>
            <div className="space-y-1">
              {availableFields.map(field => (
                <label key={field} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policySettings.editable_fields.includes(field)}
                    onChange={() => toggleField(field, "editable")}
                    className="w-4 h-4 accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-700 capitalize">{field.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-100 pt-4 space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Approval Workflow</p>
          <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
            <input type="checkbox" checked={policySettings.approval_required} onChange={e => setPolicySettings({ ...policySettings, approval_required: e.target.checked })} className="w-4 h-4 accent-zinc-900" />
            <span className="text-sm text-zinc-700">Require approval for profile changes</span>
          </label>
          <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
            <input type="checkbox" checked={policySettings.auto_approve} onChange={e => setPolicySettings({ ...policySettings, auto_approve: e.target.checked })} className="w-4 h-4 accent-zinc-900" />
            <span className="text-sm text-zinc-700">Auto-approve profile changes</span>
          </label>
        </div>
        <button
          onClick={handleSavePolicy}
          disabled={saving}
          className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Savingâ€¦" : "Save Policy"}
        </button>
      </section>

      {/* Danger Zone */}
      <section className="border border-red-200 rounded-2xl p-6">
        <p className="text-sm font-semibold text-red-700 mb-1">Danger Zone</p>
        <p className="text-xs text-zinc-400 mb-4">These actions are irreversible.</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm font-medium px-5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deletingâ€¦" : "Delete Company Workspace"}
        </button>
      </section>
    </motion.div>
  );
};

export default CompanySettings;