import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

const CompanySettings = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [policy, setPolicy] = useState<any>(null);
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
    editable_fields: ["title", "bio", "phone", "whatsapp", "email_public", "website", "location", "photo_url"] as string[],
    approval_required: false,
    auto_approve: true,
  });

  const availableFields = [
    "title",
    "bio",
    "phone",
    "whatsapp",
    "email_public",
    "website",
    "location",
    "photo_url",
  ];

  useEffect(() => {
    fetchCompanySettings();
    fetchPolicy();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<any>(`/api/company/${companyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCompany(data.company);
      setSettings({
        name: data.company.name,
        logo_url: data.company.logo_url || "",
        primary_color: data.company.primary_color,
        accent_color: data.company.accent_color,
      });
    } catch (error) {
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicy = async () => {
    try {
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<any>(`/api/company/${companyId}/policy`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setPolicySettings({
        required_fields: data.policy.required_fields || ["title", "photo_url"],
        editable_fields: data.policy.editable_fields || availableFields,
        approval_required: data.policy.approval_required,
        auto_approve: data.policy.auto_approve,
      });
    } catch (error) {
      console.error("Failed to load policy");
    }
  };

  const handleSaveCompanySettings = async () => {
    try {
      setSaving(true);
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(settings),
      });
      toast.success("Company settings saved");
      fetchCompanySettings();
    } catch (error) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      setSaving(true);
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/policy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(policySettings),
      });
      toast.success("Policy settings saved");
      fetchPolicy();
    } catch (error) {
      toast.error("Error saving policy");
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (field: string, type: "required" | "editable") => {
    if (type === "required") {
      setPolicySettings((prev) => ({
        ...prev,
        required_fields: prev.required_fields.includes(field)
          ? prev.required_fields.filter((f) => f !== field)
          : [...prev.required_fields, field],
      }));
    } else {
      setPolicySettings((prev) => ({
        ...prev,
        editable_fields: prev.editable_fields.includes(field)
          ? prev.editable_fields.filter((f) => f !== field)
          : [...prev.editable_fields, field],
      }));
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!company?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete workspace \"${company.name}\"? This will detach users, revoke invites, and retire cards.`
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      await apiRequest<{ message: string }>(`/api/company/${company.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      toast.success("Company workspace deleted");
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete workspace");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading font-bold text-3xl mb-2">Company Settings</h1>
        <p className="text-muted-foreground">Manage your company workspace configuration</p>
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace</p>
          <p className="font-semibold text-foreground mt-1">{company?.name}</p>
          <p className="text-sm text-muted-foreground mt-1">/{company?.slug}</p>
        </div>
      </motion.div>

      {/* Company Information */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6">
          <h2 className="font-heading font-bold text-lg mb-6">Company Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                type="url"
                value={settings.logo_url}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="mt-1.5"
              />
              {settings.logo_url && (
                <img src={settings.logo_url} alt="Logo preview" className="mt-2 h-12 rounded" />
              )}
            </div>

            <div>
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex gap-2 mt-1.5">
                <input
                  id="primary"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="h-10 w-20 rounded border border-border cursor-pointer"
                />
                <Input value={settings.primary_color} readOnly />
              </div>
            </div>

            <div>
              <Label htmlFor="accent">Accent Color</Label>
              <div className="flex gap-2 mt-1.5">
                <input
                  id="accent"
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="h-10 w-20 rounded border border-border cursor-pointer"
                />
                <Input value={settings.accent_color} readOnly />
              </div>
            </div>

            <Button
              onClick={handleSaveCompanySettings}
              disabled={saving}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-6"
            >
              {saving ? "Saving..." : "Save Company Settings"}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Profile Policy */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-6">
          <h2 className="font-heading font-bold text-lg mb-6">Profile Policy</h2>
          <div className="space-y-6">
            {/* Required Fields */}
            <div>
              <h3 className="font-semibold mb-3">Required Fields</h3>
              <p className="text-sm text-muted-foreground mb-4">Employees must fill out these fields</p>
              <div className="space-y-2">
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center gap-3 p-2 hover:bg-accent/5 rounded">
                    <input
                      type="checkbox"
                      checked={policySettings.required_fields.includes(field)}
                      onChange={() => toggleField(field, "required")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">{field.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Editable Fields */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-3">Editable Fields</h3>
              <p className="text-sm text-muted-foreground mb-4">Fields employees can modify</p>
              <div className="space-y-2">
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center gap-3 p-2 hover:bg-accent/5 rounded">
                    <input
                      type="checkbox"
                      checked={policySettings.editable_fields.includes(field)}
                      onChange={() => toggleField(field, "editable")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">{field.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Approval Settings */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-3">Approval Workflow</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-2 hover:bg-accent/5 rounded">
                  <input
                    type="checkbox"
                    checked={policySettings.approval_required}
                    onChange={(e) =>
                      setPolicySettings({ ...policySettings, approval_required: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Require approval for profile changes</span>
                </label>
                <label className="flex items-center gap-3 p-2 hover:bg-accent/5 rounded">
                  <input
                    type="checkbox"
                    checked={policySettings.auto_approve}
                    onChange={(e) =>
                      setPolicySettings({ ...policySettings, auto_approve: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Auto-approve profile changes</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleSavePolicy}
              disabled={saving}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-6"
            >
              {saving ? "Saving..." : "Save Policy Settings"}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="p-6 border-red-200">
          <h2 className="font-heading font-bold text-lg text-red-600 mb-4">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Irreversible actions</p>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleDeleteWorkspace} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Company Workspace"}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompanySettings;
