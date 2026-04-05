import { useState, useEffect } from "react";
import { Search, Plus, QrCode, MoreVertical, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
};

type CompanyCard = {
  id: string;
  code: string;
  status: "active" | "unassigned" | "assigned" | "suspended" | "retired";
  claim_status: boolean;
  serial_number?: string | null;
  assigned_user_id?: string | null;
  assigned_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
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

  const authHeader = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  };

  useEffect(() => {
    fetchCards();
  }, [search, status, page]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
        ...(search && { search }),
        ...(status !== "all" && { status }),
      });

      const data = await apiRequest<{ cards: CompanyCard[]; total: number }>(`/api/company/${companyId}/cards?${params}`, {
        headers: authHeader,
      });
      setCards(data.cards);
      setTotal(data.total);
    } catch (error) {
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  const copyCardCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Card code copied to clipboard");
  };

  const fetchEmployees = async () => {
    try {
      const companyId = await getCurrentCompanyId();
      const data = await apiRequest<{ employees: Employee[] }>(`/api/company/${companyId}/employees?per_page=200&status=active`, {
        headers: authHeader,
      });
      setEmployees(data.employees || []);
    } catch {
      setEmployees([]);
    }
  };

  const handleUpdateStatus = async (cardId: string, newStatus: string) => {
    try {
      await apiRequest<{ message: string }>(`/api/card/${cardId}/status`, {
        method: "PATCH",
        headers: authHeader,
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Card status updated");
      fetchCards();
    } catch (error) {
      toast.error("Error updating card");
    }
  };

  const statusColor = {
    active: "text-green-500 bg-green-50",
    unassigned: "text-blue-500 bg-blue-50",
    assigned: "text-yellow-500 bg-yellow-50",
    suspended: "text-red-500 bg-red-50",
    retired: "text-gray-500 bg-gray-50",
  };

  const claimStatusBadge = (claimed: boolean) => {
    return claimed ? (
      <span className="px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">Claimed</span>
    ) : (
      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-700">Unclaimed</span>
    );
  };

  const handleGenerateCards = async () => {
    try {
      setCreating(true);
      const companyId = await getCurrentCompanyId();
      await apiRequest<{ cards: CompanyCard[] }>(`/api/company/${companyId}/cards/generate`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({ count: 5 }),
      });
      toast.success("Cards generated successfully");
      fetchCards();
    } catch (error) {
      toast.error("Failed to generate cards");
    } finally {
      setCreating(false);
    }
  };

  const openAssignDialog = async (card: CompanyCard) => {
    setSelectedCard(card);
    setSelectedEmployeeId(card.assigned_user_id || "");
    setAssignOpen(true);
    if (employees.length === 0) {
      await fetchEmployees();
    }
  };

  const handleAssignCard = async () => {
    if (!selectedCard || !selectedEmployeeId) {
      toast.error("Select an employee first");
      return;
    }

    try {
      setAssigning(true);
      await apiRequest(`/api/card/${selectedCard.id}/${selectedCard.assigned_user_id ? "reassign" : "assign"}`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({ user_id: selectedEmployeeId }),
      });
      toast.success(selectedCard.assigned_user_id ? "Card reassigned" : "Card assigned");
      setAssignOpen(false);
      setSelectedCard(null);
      await fetchCards();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign card");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl mb-2">Card Inventory</h1>
            <p className="text-muted-foreground">Manage your NFC card ecosystem</p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleGenerateCards} disabled={creating}>
            <Plus className="w-4 h-4 mr-2" />
            {creating ? "Generating..." : "Add Cards"}
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
            placeholder="Search by code..."
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
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned (Pending)</option>
          <option value="suspended">Suspended</option>
        </select>
      </motion.div>

      {/* Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {cards.map((card) => (
          <Card key={card.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Card Code</p>
                  <p className="font-mono text-sm font-semibold break-all">{card.code}</p>
                </div>
                <button
                  onClick={() => copyCardCode(card.code)}
                  className="p-2 hover:bg-accent/10 rounded-lg transition"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusColor[card.status as keyof typeof statusColor] || "text-gray-500 bg-gray-50"
                  }`}
                >
                  {card.status}
                </span>
                {claimStatusBadge(card.claim_status)}
              </div>

              {/* Card Details */}
              <div className="space-y-2 text-sm">
                {card.assigned_user_id && (
                  <div>
                    <p className="text-muted-foreground text-xs">Assigned To</p>
                    <p className="font-medium text-xs">
                      {card.assigned_user
                        ? `${card.assigned_user.first_name} ${card.assigned_user.last_name}`
                        : `User ID: ${card.assigned_user_id.slice(0, 8)}`}
                    </p>
                    {card.assigned_user?.email && (
                      <p className="text-xs text-muted-foreground">{card.assigned_user.email}</p>
                    )}
                  </div>
                )}
                {card.serial_number && (
                  <div>
                    <p className="text-muted-foreground text-xs">Serial</p>
                    <p className="font-mono text-xs">{card.serial_number}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <a href={`/card/${card.code}`}>
                    <QrCode className="w-4 h-4 mr-2" />
                    QR
                  </a>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openAssignDialog(card)}>
                      {card.assigned_user_id ? "Reassign Card" : "Assign Card"}
                    </DropdownMenuItem>
                    {card.assigned_user_id && (
                      <DropdownMenuItem onClick={() => handleUpdateStatus(card.id, "unassigned")}>Unassign</DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        handleUpdateStatus(card.id, card.status === "active" ? "suspended" : "active")
                      }
                    >
                      {card.status === "active" ? "Suspend" : "Reactivate"}
                    </DropdownMenuItem>
                    {card.status !== "retired" && (
                      <DropdownMenuItem onClick={() => handleUpdateStatus(card.id, "retired")}>
                        Retire
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {cards.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No cards found</p>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleGenerateCards} disabled={creating}>
            <Plus className="w-4 h-4 mr-2" />
            {creating ? "Generating..." : "Add Your First Card"}
          </Button>
        </Card>
      )}

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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCard?.assigned_user_id ? "Reassign Card" : "Assign Card"}</DialogTitle>
            <DialogDescription>
              {selectedCard ? `Choose an employee for card ${selectedCard.code}.` : "Choose an employee."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Employee</label>
            <select
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select an employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} ({employee.email})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignCard} disabled={assigning}>
              {assigning ? "Saving..." : selectedCard?.assigned_user_id ? "Reassign" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CardManagement;
