import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Mail, Download, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

type AdminUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  company_id?: string | null;
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  department_id?: string | null;
  created_at?: string | null;
};

type AdminCompany = {
  id: string;
  name: string;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteCompanyId, setInviteCompanyId] = useState("");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        per_page: "200",
        ...(filter !== "all" && { status: filter }),
      });

      const response = await apiRequest<{ users: AdminUser[] }>(`/api/admin/users?${params}`, {
        headers: authHeaders,
      });
      setUsers(response.users || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await apiRequest<{ companies: AdminCompany[] }>("/api/admin/companies?per_page=200", {
          headers: authHeaders,
        });
        setCompanies(response.companies || []);
        setInviteCompanyId((current) => current || response.companies?.[0]?.id || "");
      } catch {
        setCompanies([]);
      }
    };

    fetchCompanies();
    fetchUsers();
  }, [filter]);

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();
    return (
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchText) ||
      user.email.toLowerCase().includes(searchText)
    );
  });

  const exportUsers = () => {
    const rows = [
      ["first_name", "last_name", "email", "role", "status", "company_id", "company_name"],
      ...filteredUsers.map((user) => [
        user.first_name,
        user.last_name,
        user.email,
        user.role,
        user.status,
        user.company_id || "",
        user.company?.name || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-users.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported");
  };

  const inviteUser = async () => {
    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) {
      toast.error("First name, last name, and email are required");
      return;
    }

    try {
      setInviting(true);
      const response = await apiRequest<{ user: AdminUser; temporary_password: string }>("/api/admin/users/invite", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          first_name: inviteFirstName.trim(),
          last_name: inviteLastName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          company_id: inviteCompanyId || undefined,
        }),
      });

      toast.success(`Invited ${response.user.email}`);
      setInviteOpen(false);
      setInviteFirstName("");
      setInviteLastName("");
      setInviteEmail("");
      setInviteRole("employee");
      await fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-accent/10 text-accent border-0";
      case "inactive": return "bg-secondary text-muted-foreground border-0";
      case "suspended": return "bg-destructive/10 text-destructive border-0";
      default: return "";
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} users in the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportUsers}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
            <Mail className="w-3.5 h-3.5 mr-1.5" /> Invite User
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "active", "inactive", "suspended"].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading users...</Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No users found</Card>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Company</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell capitalize text-foreground">{user.role}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${statusColor(user.status)} capitalize text-xs`}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{user.company?.name || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/users/${user.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Create a live account with a temporary password.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input value={inviteFirstName} onChange={(event) => setInviteFirstName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input value={inviteLastName} onChange={(event) => setInviteLastName(event.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="employee">Employee</option>
                <option value="company_admin">Company Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <select
                value={inviteCompanyId}
                onChange={(event) => setInviteCompanyId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">No company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={inviteUser} disabled={inviting}>
              {inviting ? "Inviting..." : "Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminUsers;