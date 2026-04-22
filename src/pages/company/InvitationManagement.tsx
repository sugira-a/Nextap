import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

const InvitationManagement = () => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [showForm, setShowForm] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => { fetchInvitations(); }, [tab]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<{ invitations: any[] }>(`/api/company/${companyId}/invitations?status=${tab}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      setInvitations(data.invitations);
    } catch { toast.error("Failed to load invitations"); }
    finally { setLoading(false); }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail) { toast.error("Enter an email address"); return; }
    try {
      setInviting(true);
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<any>(`/api/company/${companyId}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      toast.success("Invitation sent");
      navigator.clipboard.writeText(`${window.location.origin}/invitation/${data.invitation.token}/accept`);
      toast.success("Link copied to clipboard");
      setInviteEmail(""); setInviteRole("employee"); setShowForm(false);
      fetchInvitations();
    } catch { toast.error("Error sending invitation"); }
    finally { setInviting(false); }
  };

  const handleResend = async (id: string) => {
    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/invitations/${id}/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      toast.success("Invitation resent");
    } catch { toast.error("Error resending"); }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Revoke this invitation?")) return;
    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/invitations/${id}/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      toast.success("Invitation revoked");
      fetchInvitations();
    } catch { toast.error("Error revoking"); }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invitation/${token}/accept`);
    toast.success("Link copied");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-8 py-2"
    >
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Company</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Invitations</h1>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors"
        >
          {showForm ? "Cancel" : "Invite Employee"}
        </button>
      </div>

      {/* Invite form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4"
        >
          <p className="text-sm font-semibold text-zinc-900">New Invitation</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="employee@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="employee">Employee</option>
                <option value="company_admin">Company Admin</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleSendInvitation}
            disabled={inviting}
            className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {inviting ? "Sendingâ€¦" : "Send Invitation"}
          </button>
        </motion.div>
      )}

      {/* Tab filter */}
      <div className="flex gap-1.5 bg-zinc-100 rounded-lg p-1 w-fit">
        {["pending", "accepted", "expired"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-4 py-1.5 rounded-md font-medium transition-colors capitalize ${
              tab === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Invitations list */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          </div>
        ) : invitations.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{inv.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      inv.status === "pending" ? "bg-amber-50 text-amber-700" :
                      inv.status === "accepted" ? "bg-emerald-50 text-emerald-700" :
                      "bg-zinc-100 text-zinc-500"
                    }`}>{inv.status}</span>
                    <span className="text-xs text-zinc-400 capitalize">{inv.role?.replace("_", " ")}</span>
                    <span className="text-xs text-zinc-300">
                      {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                {tab === "pending" && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => copyLink(inv.token)}
                      className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => handleResend(inv.id)}
                      className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Resend
                    </button>
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-zinc-400">
            No {tab} invitations
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InvitationManagement;