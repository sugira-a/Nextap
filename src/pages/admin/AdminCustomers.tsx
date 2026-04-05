import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, RefreshCw, UserRoundPen, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Customer = {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
  };
  profile: {
    public_slug: string;
    title?: string | null;
    bio?: string | null;
    phone?: string | null;
    website?: string | null;
    location?: string | null;
    linkedin_url?: string | null;
    twitter_url?: string | null;
    instagram_url?: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  card?: {
    code: string;
    status: string;
  } | null;
};

type CustomerResponse = {
  customers: Customer[];
  total: number;
};

const emptyForm = {
  first_name: "",
  last_name: "",
  status: "active",
  public_slug: "",
  title: "",
  bio: "",
  phone: "",
  website: "",
  location: "",
  linkedin_url: "",
  twitter_url: "",
  instagram_url: "",
};

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        per_page: "200",
        ...(status !== "all" && { status }),
        ...(search.trim() && { search: search.trim() }),
      });

      const response = await apiRequest<CustomerResponse>(`/api/admin/customers?${params}`, {
        headers: authHeaders,
      });

      setCustomers(response.customers || []);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [status]);

  const filtered = customers.filter((customer) => {
    if (!search.trim()) {
      return true;
    }
    const q = search.toLowerCase();
    return (
      `${customer.user.first_name} ${customer.user.last_name}`.toLowerCase().includes(q) ||
      customer.user.email.toLowerCase().includes(q) ||
      (customer.profile?.public_slug || "").toLowerCase().includes(q)
    );
  });

  const statusBadge = (value: string) => {
    switch (value) {
      case "active":
        return "bg-accent/10 text-accent border-0";
      case "inactive":
        return "bg-secondary text-muted-foreground border-0";
      case "suspended":
        return "bg-destructive/10 text-destructive border-0";
      default:
        return "";
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} customer accounts</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCustomers}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "active", "inactive", "suspended"].map((value) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                status === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading customers...</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No customers found</Card>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Profile</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.user.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{customer.user.first_name} {customer.user.last_name}</p>
                    <p className="text-xs text-muted-foreground">{customer.user.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-foreground text-xs">/{customer.profile?.public_slug || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[220px]">{customer.profile?.title || customer.profile?.location || "No profile details"}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{customer.company?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${statusBadge(customer.user.status)} capitalize text-xs`}>{customer.user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/customers/${customer.user.id}`)}>
                      <UserRoundPen className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default AdminCustomers;
