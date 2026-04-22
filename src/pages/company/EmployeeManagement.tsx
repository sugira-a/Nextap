import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  card?: { code: string } | null;
};

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchEmployees(); }, [search, status, page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const params = new URLSearchParams({ page: page.toString(), per_page: "20", ...(search && { search }), ...(status !== "all" && { status }) });
      const data = await apiRequest<{ employees: Employee[]; total: number }>(`/api/company/${companyId}/employees?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      setEmployees(data.employees);
      setTotal(data.total);
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  };

  const handleRemoveEmployee = async (id: string) => {
    if (!window.confirm("Remove this employee? This cannot be undone.")) return;
    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/employees/${id}/remove`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      toast.success("Employee removed");
      fetchEmployees();
    } catch { toast.error("Error removing employee"); }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/employees/${id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Status updated");
      fetchEmployees();
    } catch { toast.error("Error updating status"); }
  };

  const totalPages = Math.ceil(total / 20);

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
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Employees</h1>
          <p className="text-sm text-zinc-400 mt-1">{total} members</p>
        </div>
        <Link
          to="/company/invitations"
          className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Invite Employee
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
        />
        <div className="flex gap-1.5 bg-zinc-100 rounded-lg p-1">
          {["all", "active", "inactive", "suspended"].map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors capitalize ${
                status === s ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          </div>
        ) : employees.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            <div className="grid grid-cols-12 px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="col-span-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Name</span>
              <span className="col-span-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Email</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Role</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Card / Action</span>
            </div>
            {employees.map(emp => (
              <div key={emp.id} className="grid grid-cols-12 px-6 py-3.5 hover:bg-zinc-50 transition-colors items-center">
                <div className="col-span-3">
                  <p className="text-sm font-medium text-zinc-900">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs text-zinc-400">{emp.id.slice(0, 8)}</p>
                </div>
                <div className="col-span-3 text-sm text-zinc-600 truncate">{emp.email}</div>
                <div className="col-span-2 text-sm text-zinc-500 capitalize">{emp.role?.replace("_", " ")}</div>
                <div className="col-span-2">
                  <select
                    value={emp.status}
                    onChange={e => handleUpdateStatus(emp.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${
                      emp.status === "active" ? "bg-emerald-50 text-emerald-700" :
                      emp.status === "suspended" ? "bg-red-50 text-red-600" :
                      "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="suspended">suspended</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-3">
                  {emp.card ? (
                    <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">{emp.card.code}</span>
                  ) : (
                    <span className="text-xs text-zinc-400">No card</span>
                  )}
                  <button
                    onClick={() => handleRemoveEmployee(emp.id)}
                    className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-sm text-zinc-400">
            <p>No employees found</p>
            <Link to="/company/invitations" className="mt-2 text-zinc-600 underline underline-offset-2 text-xs hover:text-zinc-900">
              Invite one now
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">{total} total Â· page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EmployeeManagement;