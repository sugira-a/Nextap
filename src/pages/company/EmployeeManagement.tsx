import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Mail, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchEmployees();
  }, [search, status, page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
        ...(search && { search }),
        ...(status !== "all" && { status }),
      });

      const data = await apiRequest<{ employees: any[]; total: number }>(`/api/company/${companyId}/employees?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setEmployees(data.employees);
      setTotal(data.total);
    } catch (error) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;

    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest<{ message: string }>(`/api/company/${companyId}/employees/${employeeId}/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      toast.success("Employee removed");
      fetchEmployees();
    } catch (error) {
      toast.error("Error removing employee");
    }
  };

  const handleUpdateStatus = async (employeeId: string, newStatus: string) => {
    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest<{ message: string }>(`/api/company/${companyId}/employees/${employeeId}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Employee status updated");
      fetchEmployees();
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const statusColor = {
    active: "text-green-500 bg-green-50",
    inactive: "text-gray-500 bg-gray-50",
    suspended: "text-red-500 bg-red-50",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl mb-2">Employees</h1>
            <p className="text-muted-foreground">Manage your team members and assignments</p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <a href="/company/invitations">
              <Plus className="w-4 h-4 mr-2" />
              Invite Employee
            </a>
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-4 flex-col sm:flex-row"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </motion.div>

      {/* Employees Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Card</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border hover:bg-accent/5 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">ID: {employee.id.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{employee.email}</td>
                    <td className="px-6 py-4 text-sm capitalize">{employee.role}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColor[employee.status as keyof typeof statusColor] || "text-gray-500 bg-gray-50"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {employee.card ? (
                        <span className="font-mono text-xs bg-accent/10 px-2 py-1 rounded">{employee.card.code}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(employee.email);
                            toast.success("Employee email copied");
                          }}>
                            Copy Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(
                                employee.id,
                                employee.status === "active" ? "inactive" : "active"
                              )
                            }
                          >
                            {employee.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemoveEmployee(employee.id)}>
                            <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                            <span className="text-red-500">Remove</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No employees found</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="px-4 py-2 text-sm">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button variant="outline" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
