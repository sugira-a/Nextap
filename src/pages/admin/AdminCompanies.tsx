import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Plus, RefreshCw, Users, CreditCard, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";

type Company = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  subscription_seats: number;
  primary_color: string;
  accent_color: string;
  created_at: string;
  stats?: {
    employee_count: number;
    card_count: number;
    invitation_count: number;
  };
};

type CompanyListResponse = {
  companies: Company[];
  total: number;
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const AdminCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [adminFirstName, setAdminFirstName] = useState("Company");
  const [adminLastName, setAdminLastName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [issuedCredentials, setIssuedCredentials] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<CompanyListResponse>("/api/admin/companies", {
        headers: authHeaders,
      });
      setCompanies(data.companies || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !slug.trim()) {
      toast.error("Company name and slug are required");
      return;
    }

    try {
      setCreating(true);
      const response = await apiRequest<{
        message: string;
        company_admin?: {
          email: string;
          temporary_password: string;
        };
      }>("/api/company/create", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: name.trim(),
          slug: toSlug(slug),
          plan,
          admin_first_name: adminFirstName.trim(),
          admin_last_name: adminLastName.trim(),
          admin_email: adminEmail.trim() || undefined,
          admin_password: adminPassword || undefined,
        }),
      });

      toast.success("Company created successfully");
      setName("");
      setSlug("");
      setPlan("starter");
      setAdminFirstName("Company");
      setAdminLastName("Admin");
      setAdminEmail("");
      setAdminPassword("");

      if (response.company_admin?.email && response.company_admin?.temporary_password) {
        setIssuedCredentials({
          email: response.company_admin.email,
          temporaryPassword: response.company_admin.temporary_password,
        });
      } else {
        setIssuedCredentials(null);
      }

      await fetchCompanies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage company workspaces and plans
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCompanies}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-accent" />
          <h2 className="font-heading font-semibold">Create Company</h2>
        </div>

        <form onSubmit={handleCreateCompany} className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(event) => {
                const value = event.target.value;
                setName(value);
                if (!slug) {
                  setSlug(toSlug(value));
                }
              }}
              placeholder="Acme Corporation"
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="company-slug">Slug</Label>
            <Input
              id="company-slug"
              value={slug}
              onChange={(event) => setSlug(toSlug(event.target.value))}
              placeholder="acme-corp"
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="company-plan">Plan</Label>
            <select
              id="company-plan"
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <Label htmlFor="company-admin-first-name">Admin First Name</Label>
            <Input
              id="company-admin-first-name"
              value={adminFirstName}
              onChange={(event) => setAdminFirstName(event.target.value)}
              placeholder="Company"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="company-admin-last-name">Admin Last Name</Label>
            <Input
              id="company-admin-last-name"
              value={adminLastName}
              onChange={(event) => setAdminLastName(event.target.value)}
              placeholder="Admin"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="company-admin-email">Admin Email (optional)</Label>
            <Input
              id="company-admin-email"
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="owner@acme.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="company-admin-password">Admin Password (optional)</Label>
            <Input
              id="company-admin-password"
              type="text"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="Leave blank to auto-generate"
              className="mt-1.5"
            />
          </div>
          <div className="md:col-span-4">
            <Button type="submit" disabled={creating} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Building2 className="w-4 h-4 mr-1.5" />
              {creating ? "Creating..." : "Create Company"}
            </Button>
          </div>
        </form>

        {issuedCredentials && (
          <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">
            <p className="font-medium text-foreground">Company Admin Credentials</p>
            <p className="text-muted-foreground mt-1">Email: <span className="font-medium text-foreground">{issuedCredentials.email}</span></p>
            <p className="text-muted-foreground">Password: <span className="font-medium text-foreground">{issuedCredentials.temporaryPassword}</span></p>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-heading font-semibold">All Companies ({companies.length})</h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading companies...</div>
        ) : companies.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No companies found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Company</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Seats</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Stats</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{company.name}</p>
                      <p className="text-xs text-muted-foreground">/{company.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="capitalize bg-accent/10 text-accent border-0">{company.plan}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-foreground">{company.subscription_seats}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      <span className="inline-flex items-center mr-3"><Users className="w-3.5 h-3.5 mr-1" />{company.stats?.employee_count ?? 0}</span>
                      <span className="inline-flex items-center"><CreditCard className="w-3.5 h-3.5 mr-1" />{company.stats?.card_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/companies/${company.id}`}>
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
      </div>
    </motion.div>
  );
};

export default AdminCompanies;