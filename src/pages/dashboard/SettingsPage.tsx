import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, ChevronDown, User, Lock, AlertTriangle, Copy, Check } from "lucide-react";
import { apiRequest } from "@/lib/api";

const SettingsPage = () => {
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [copied, setCopied] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      const data = await apiRequest<{ user: { email: string }; profile: { public_slug: string } | null }>("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setEmail(data.user.email);
      setSlug(data.profile?.public_slug || "");
    };
    load().catch(() => toast.error("Failed to load settings", { duration: 2000 }));
  }, []);

  const saveAccount = async () => {
    try {
      setSavingAccount(true);
      const token = localStorage.getItem("access_token");
      await apiRequest("/api/profile/me/update", {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ public_slug: slug }),
      });
      toast.success("Username updated", { duration: 2000 });
    } catch {
      toast.error("Failed to save settings", { duration: 2000 });
    } finally {
      setSavingAccount(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match", { duration: 2000 }); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters", { duration: 2000 }); return; }
    try {
      setSavingPassword(true);
      const token = localStorage.getItem("access_token");
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      toast.success("Password changed successfully", { duration: 2000 });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password", { duration: 2000 });
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem("access_token");
      await apiRequest("/api/auth/me", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete account", { duration: 2000 });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const pwStrength = (() => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return { label: "Too short", color: "bg-red-400", w: "w-1/4" };
    if (newPassword.length < 12 && !/[A-Z]/.test(newPassword)) return { label: "Weak", color: "bg-orange-400", w: "w-2/4" };
    if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) return { label: "Strong", color: "bg-emerald-500", w: "w-full" };
    return { label: "Fair", color: "bg-yellow-400", w: "w-3/4" };
  })();

  const PasswordField = ({ label, value, show, onToggle, onChange, placeholder }: {
    label: string; value: string; show: boolean;
    onToggle: () => void; onChange: (v: string) => void; placeholder: string;
  }) => (
    <div>
      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-zinc-200 rounded-xl px-4 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-300 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all bg-white"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-2xl mx-auto space-y-6 py-2"
    >
      {/* Header */}
      <div className="pb-5 border-b border-zinc-100">
        <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">Settings</p>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Account</h1>
      </div>

      {/* Account Info */}
      <section className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">Account Info</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Email</label>
            <div className="flex items-center border border-zinc-100 rounded-xl px-4 py-3 bg-zinc-50/80 gap-3">
              <span className="text-sm text-zinc-600 flex-1 truncate">{email}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Verified
              </span>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Public Username</label>
            <div className="flex gap-2">
              <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden flex-1 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/5 transition-all">
                <span className="px-3 py-3 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-100 select-none font-mono">/u/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  className="flex-1 px-3 py-3 text-sm text-zinc-900 bg-white outline-none placeholder:text-zinc-300"
                  placeholder="your-username"
                />
              </div>
              <button
                onClick={saveAccount}
                disabled={savingAccount}
                className="px-5 py-3 text-sm font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                {savingAccount ? "Saving…" : "Save"}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <p className="text-xs text-zinc-400">
                Public at <span className="text-zinc-600 font-medium">/u/{slug || "your-username"}</span>
              </p>
              <button onClick={copyLink} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                {copied
                  ? <><Check className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-600 font-medium">Copied</span></>
                  : <><Copy className="w-3 h-3" /> Copy link</>
                }
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Change Password — collapsible */}
      <section className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setPasswordOpen((o) => !o)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">Change Password</p>
          </div>
          <motion.div animate={{ rotate: passwordOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {passwordOpen && (
            <motion.div
              key="pw-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-1 space-y-4 border-t border-zinc-100">
                <PasswordField label="Current Password" value={currentPassword} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} onChange={setCurrentPassword} placeholder="Enter current password" />
                <PasswordField label="New Password" value={newPassword} show={showNew} onToggle={() => setShowNew(v => !v)} onChange={setNewPassword} placeholder="Min. 8 characters" />

                {/* Strength bar */}
                {pwStrength && (
                  <div className="space-y-1.5">
                    <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div
                        key={pwStrength.w}
                        initial={{ width: 0 }}
                        animate={{ width: pwStrength.w === "w-full" ? "100%" : pwStrength.w === "w-3/4" ? "75%" : pwStrength.w === "w-2/4" ? "50%" : "25%" }}
                        className={`h-full rounded-full ${pwStrength.color}`}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className={`text-xs font-medium ${pwStrength.color.replace("bg-", "text-").replace("-400", "-600").replace("-500", "-600")}`}>{pwStrength.label}</p>
                  </div>
                )}

                <PasswordField label="Confirm New Password" value={confirmPassword} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} onChange={setConfirmPassword} placeholder="Repeat new password" />

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordOpen(false); }}
                    className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePassword}
                    disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="px-5 py-2.5 text-sm font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    {savingPassword ? "Saving…" : "Update Password"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Danger Zone */}
      <section className="bg-white border border-red-100/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-50 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-red-600">Danger Zone</p>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Delete Account</p>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">Permanently deletes your account and all data. Cannot be undone.</p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors shrink-0"
          >
            Delete
          </button>
        </div>
      </section>
    </motion.div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => !deleting && setDeleteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-zinc-900 text-center">Delete Account?</h2>
              <p className="text-sm text-zinc-500 text-center mt-2 leading-relaxed">
                This will permanently remove your account and all associated data.{" "}
                <span className="font-semibold text-zinc-700">This cannot be undone.</span>
              </p>
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-sm font-semibold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsPage;
