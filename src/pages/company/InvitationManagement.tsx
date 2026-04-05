import { useState, useEffect } from "react";
import { Mail, Plus, Copy, MoreVertical, RotateCw, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, [tab]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<{ invitations: any[] }>(`/api/company/${companyId}/invitations?status=${tab}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setInvitations(data.invitations);
    } catch (error) {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setInviting(true);
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<any>(`/api/company/${companyId}/invitations/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      toast.success("Invitation sent successfully");
      setInviteEmail("");
      setInviteRole("employee");
      setInviteDialogOpen(false);
      fetchInvitations();

      navigator.clipboard.writeText(`${window.location.origin}/invitation/${data.invitation.token}/accept`);
      toast.success("Invitation link copied to clipboard");
    } catch (error) {
      toast.error("Error sending invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest<{ message: string }>(`/api/company/${companyId}/invitations/${invitationId}/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      toast.success("Invitation resent");
      fetchInvitations();
    } catch (error) {
      toast.error("Error resending invitation");
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Revoke this invitation?")) return;

    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest<{ message: string }>(`/api/company/${companyId}/invitations/${invitationId}/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      toast.success("Invitation revoked");
      fetchInvitations();
    } catch (error) {
      toast.error("Error revoking invitation");
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/invitation/${token}/accept`;
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard");
  };

  const statusBadgeColor = {
    pending: "bg-yellow-50 text-yellow-700",
    accepted: "bg-green-50 text-green-700",
    expired: "bg-red-50 text-red-700",
    revoked: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl mb-2">Invitations</h1>
            <p className="text-muted-foreground">Manage employee invitations and onboarding</p>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Invite Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="employee@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground mt-1.5"
                  >
                    <option value="employee">Employee</option>
                    <option value="company_admin">Company Admin</option>
                  </select>
                </div>
                <Button
                  onClick={handleSendInvitation}
                  disabled={inviting}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {inviting ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-4 border-b border-border"
      >
        {["pending", "accepted", "expired"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === t
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Invitations List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited{" "}
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusBadgeColor[invitation.status as keyof typeof statusBadgeColor] ||
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {invitation.status}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{invitation.role}</span>
                      {invitation.is_expired && (
                        <span className="text-xs text-red-600">Expired</span>
                      )}
                    </div>
                  </div>
                  {tab === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyInvitationLink(invitation.token)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleResendInvitation(invitation.id)}
                          >
                            <RotateCw className="w-4 h-4 mr-2" />
                            Resend
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRevokeInvitation(invitation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Revoke
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {tab === "pending" && "No pending invitations"}
              {tab === "accepted" && "No accepted invitations yet"}
              {tab === "expired" && "No expired invitations"}
            </p>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default InvitationManagement;
