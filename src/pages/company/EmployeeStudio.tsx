import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Mail,
  Phone, Briefcase, MapPin, Link as LinkIcon, Users, Grid,
  List, ChevronRight, CheckCircle2, Circle, Eye, Copy,
  Sparkles, GripVertical, Download, Upload,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  phone?: string;
  card?: { code: string } | null;
};

type ViewMode = "grid" | "list";

const EmployeeStudio = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name" | "status" | "role">("name");
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, [search, status, sortBy]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const params = new URLSearchParams({
        per_page: "100",
        ...(search && { search }),
        ...(status !== "all" && { status }),
      });
      const data = await apiRequest<{ employees: Employee[]; total: number }>(
        `/api/company/${companyId}/employees?${params}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }
      );
      let sorted = data.employees;
      if (sortBy === "name") {
        sorted.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
      } else if (sortBy === "status") {
        sorted.sort((a, b) => a.status.localeCompare(b.status));
      } else if (sortBy === "role") {
        sorted.sort((a, b) => (a.role || "").localeCompare(b.role || ""));
      }
      setEmployees(sorted);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Remove this employee? This cannot be undone.")) return;
    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest(`/api/company/${companyId}/employees/${id}/remove`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      toast.success("Employee removed");
      fetchEmployees();
      setSelectedEmployees(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    } catch {
      toast.error("Error removing employee");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const companyId = await getCurrentCompanyId();
      await apiRequest(`/api/company/${companyId}/employees/${id}/update`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Status updated");
      fetchEmployees();
    } catch {
      toast.error("Error updating status");
    }
  };

  const toggleEmployeeSelection = (id: string) => {
    const updated = new Set(selectedEmployees);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedEmployees(updated);
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.size === employees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(employees.map(e => e.id)));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      inactive: "bg-zinc-50 text-zinc-600 border-zinc-200",
    };
    return colors[status] || colors.pending;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-800",
      pending: "bg-amber-100 text-amber-800",
      inactive: "bg-zinc-100 text-zinc-800",
    };
    return colors[status] || colors.pending;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-7xl mx-auto space-y-6 py-2"
    >
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">
              Management
            </p>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8" />
              Employee Studio
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              Manage, organize, and build profiles for {employees.length} team member{employees.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 relative min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              showFilters
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "name" | "status" | "role")}
            className="px-4 py-2.5 border border-zinc-200 rounded-lg text-sm text-zinc-900 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="role">Sort by Role</option>
          </select>

          <div className="flex gap-1 border border-zinc-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === "grid"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === "list"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-zinc-200 pt-4 space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-zinc-600 mb-2 block">
                  Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["all", "active", "pending", "inactive"].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        status === s
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection toolbar */}
        {selectedEmployees.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-zinc-200 pt-4 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-zinc-700">
              {selectedEmployees.size} selected
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                Export
              </button>
              <button className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <Sparkles className="w-8 h-8 text-zinc-400 animate-pulse" />
          </div>
          <p className="text-sm text-zinc-500 mt-2">Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 border border-zinc-200 rounded-xl bg-zinc-50">
          <Users className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-600 mb-1">No employees found</p>
          <p className="text-xs text-zinc-500">Start by inviting your first team member</p>
        </div>
      ) : viewMode === "grid" ? (
        <div>
          {/* Selection checkbox header */}
          <div className="mb-4 flex items-center gap-3 px-4">
            <button
              onClick={toggleSelectAll}
              className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
            >
              {selectedEmployees.size === employees.length ? (
                <CheckCircle2 className="w-5 h-5 text-zinc-900" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-400" />
              )}
            </button>
            {selectedEmployees.size > 0 && (
              <span className="text-xs font-medium text-zinc-600">
                {selectedEmployees.size} / {employees.length}
              </span>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {employees.map((emp, idx) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "border border-zinc-200 rounded-xl p-4 bg-white hover:shadow-lg transition-all group cursor-pointer relative",
                    selectedEmployees.has(emp.id) && "border-zinc-900 bg-zinc-50"
                  )}
                >
                  {/* Selection checkbox */}
                  <button
                    onClick={() => toggleEmployeeSelection(emp.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-zinc-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {selectedEmployees.has(emp.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-zinc-900" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>

                  {/* Profile */}
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">
                        {emp.first_name[0]}
                        {emp.last_name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 truncate">
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <p className="text-xs text-zinc-500 truncate">{emp.role}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-md border", getStatusBadgeColor(emp.status))}>
                          {emp.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-2 mb-4 text-xs text-zinc-600">
                    {emp.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{emp.phone}</span>
                      </div>
                    )}
                    {emp.department && (
                      <div className="flex items-center gap-2 truncate">
                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{emp.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-zinc-100 pt-3 flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleUpdateStatus(emp.id, emp.status === "active" ? "inactive" : "active")}
                        className="p-2 rounded-md hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-700"
                        title={emp.status === "active" ? "Deactivate" : "Activate"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-md hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-700"
                        title="View Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)}
                        className="p-2 rounded-md hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-700"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {activeMenu === emp.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                            className="absolute right-0 top-10 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 min-w-48"
                          >
                            <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-b border-zinc-100">
                              <Edit className="w-4 h-4" />
                              Edit Profile
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-b border-zinc-100">
                              <LinkIcon className="w-4 h-4" />
                              Create Card
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-b border-zinc-100">
                              <Copy className="w-4 h-4" />
                              Duplicate
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteEmployee(emp.id);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* List view */
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 rounded-md hover:bg-zinc-100 transition-colors"
                    >
                      {selectedEmployees.size === employees.length ? (
                        <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {employees.map((emp, idx) => (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={cn(
                        "border-b border-zinc-100 hover:bg-zinc-50 transition-colors",
                        selectedEmployees.has(emp.id) && "bg-zinc-50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleEmployeeSelection(emp.id)}
                          className="p-1 rounded-md hover:bg-zinc-100 transition-colors"
                        >
                          {selectedEmployees.has(emp.id) ? (
                            <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {emp.first_name[0]}
                              {emp.last_name[0]}
                            </span>
                          </div>
                          {emp.first_name} {emp.last_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">{emp.email}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600">{emp.role}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-md border", getStatusColor(emp.status))}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)}
                            className="p-1 rounded-md hover:bg-zinc-200 transition-colors text-zinc-500"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {activeMenu === emp.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                className="absolute right-0 top-8 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 min-w-48"
                              >
                                <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-b border-zinc-100">
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-b border-zinc-100">
                                  <LinkIcon className="w-4 h-4" />
                                  Create Card
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteEmployee(emp.id);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EmployeeStudio;
