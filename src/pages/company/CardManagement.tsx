import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/auth-context";

type Employee = { id: string; first_name: string; last_name: string; email: string; status: string };
type CompanyCard = {
  id: string;
  code: string;
  status: "active" | "unassigned" | "assigned" | "suspended" | "retired";
  claim_status: boolean;
  serial_number?: string | null;
  assigned_user_id?: string | null;
  assigned_user?: { id: string; first_name: string; last_name: string; email: string } | null;
};

const CardManagement = () => {
  const [cards, setCards] = useState<CompanyCard[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CompanyCard | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const authHeader = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };

  useEffect(() => { fetchCards(); }, [search, status, page]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const params = new URLSearchParams({ page: page.toString(), per_page: "20", ...(search && { search }), ...(status !== "all" && { status }) });
      const data = await apiRequest<{ cards: CompanyCard[]; total: number }>(`/api/company/${companyId}/cards?${params}`, { headers: authHeader });
      setCards(data.cards);
      setTotal(data.total);
    } catch { toast.error("Failed to load cards"); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<{ employees: Employee[] }>(`/api/company/${companyId}/employees?per_page=200&status=active`, { headers: authHeader });
      setEmployees(data.employees || []);
    } catch { setEmployees([]); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleUpdateStatus = async (cardId: string, newStatus: string) => {
    try {
      await apiRequest<any>(`/api/card/${cardId}/status`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Status updated");
      fetchCards();
    } catch { toast.error("Error updating card"); }
  };

  const handleGenerateCards = async () => {
    try {
      setCreating(true);
      const companyId = await getCurrentCompanyId();
      await apiRequest<any>(`/api/company/${companyId}/cards/generate`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });
      toast.success("5 cards generated");
      fetchCards();
    } catch { toast.error("Failed to generate cards"); }
    finally { setCreating(false); }
  };

  const openAssignDialog = async (card: CompanyCard) => {
    setSelectedCard(card);
    setSelectedEmployeeId(card.assigned_user_id || "");
    setAssignOpen(true);
    if (employees.length === 0) await fetchEmployees();
  };

  const handleAssignCard = async () => {
    if (!selectedCard || !selectedEmployeeId) { toast.error("Select an employee first"); return; }
    try {
      setAssigning(true);
      await apiRequest(`/api/card/${selectedCard.id}/${selectedCard.assigned_user_id ? "reassign" : "assign"}`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedEmployeeId }),
      });
      toast.success(selectedCard.assigned_user_id ? "Card reassigned" : "Card assigned");
      setAssignOpen(false);
      setSelectedCard(null);
      fetchCards();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to assign card"); }
    finally { setAssigning(false); }
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
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Card Inventory</h1>
          <p className="text-sm text-zinc-400 mt-1">{total} cards</p>
        </div>
        <button
          onClick={handleGenerateCards}
          disabled={creating}
          className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {creating ? "Generatingâ€¦" : "Add Cards"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by codeâ€¦"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
        />
        <div className="flex gap-1.5 bg-zinc-100 rounded-lg p-1">
          {["all", "active", "unassigned", "assigned", "suspended"].map(s => (
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
        ) : cards.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            <div className="grid grid-cols-12 px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="col-span-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Code</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Claimed</span>
              <span className="col-span-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Assigned To</span>
              <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Actions</span>
            </div>
            {cards.map(card => (
              <div key={card.id} className="grid grid-cols-12 px-6 py-3.5 hover:bg-zinc-50 transition-colors items-center">
                <div className="col-span-3 flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-zinc-900">{card.code}</span>
                  <button
                    onClick={() => copyCode(card.code)}
                    className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    {copied === card.code ? "âœ“" : "Copy"}
                  </button>
                </div>
                <div className="col-span-2">
                  <select
                    value={card.status}
                    onChange={e => handleUpdateStatus(card.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${
                      card.status === "active" ? "bg-emerald-50 text-emerald-700" :
                      card.status === "suspended" ? "bg-red-50 text-red-600" :
                      card.status === "retired" ? "bg-zinc-200 text-zinc-500" :
                      "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {["active", "unassigned", "assigned", "suspended", "retired"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    card.claim_status ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                  }`}>{card.claim_status ? "Claimed" : "Unclaimed"}</span>
                </div>
                <div className="col-span-3 text-sm">
                  {card.assigned_user ? (
                    <div>
                      <p className="text-zinc-900 font-medium">{card.assigned_user.first_name} {card.assigned_user.last_name}</p>
                      <p className="text-xs text-zinc-400">{card.assigned_user.email}</p>
                    </div>
                  ) : <span className="text-zinc-400 text-xs">Unassigned</span>}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openAssignDialog(card)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {card.assigned_user_id ? "Reassign" : "Assign"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-sm text-zinc-400">
            <p>No cards found</p>
            <button
              onClick={handleGenerateCards}
              disabled={creating}
              className="bg-zinc-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Generate Cards
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">{total} total Â· page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      )}

      {/* Assign dialog */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <p className="text-sm font-semibold text-zinc-900 mb-1">
              {selectedCard?.assigned_user_id ? "Reassign Card" : "Assign Card"}
            </p>
            <p className="text-xs text-zinc-400 mb-4">
              {selectedCard ? `Card ${selectedCard.code}` : ""}
            </p>
            <div className="mb-4">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Select Employee</label>
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              >
                <option value="">Choose employeeâ€¦</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAssignOpen(false)} className="flex-1 text-sm border border-zinc-200 rounded-xl py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">Cancel</button>
              <button onClick={handleAssignCard} disabled={assigning || !selectedEmployeeId} className="flex-1 bg-zinc-900 text-white text-sm rounded-xl py-2.5 hover:bg-zinc-700 transition-colors disabled:opacity-50">
                {assigning ? "Savingâ€¦" : selectedCard?.assigned_user_id ? "Reassign" : "Assign"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default CardManagement;