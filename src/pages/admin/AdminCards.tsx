import { useEffect, useState } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Download, RefreshCw, Link2, QrCode, Printer } from "lucide-react";
import { toast } from "sonner";
import { apiRequest, apiRequestWithFallback } from "@/lib/api";
import { Link } from "react-router-dom";

type AdminCard = {
  id: string;
  code: string;
  short_code?: string;
  landing_path?: string;
  status: string;
  claim_status: boolean;
  serial_number?: string | null;
  created_at?: string | null;
  assigned_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
};

type AdminCompany = {
  id: string;
  name: string;
};

type GenerateCardsResponse = {
  message: string;
  cards: AdminCard[];
};

const AdminCards = () => {
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [generateCount, setGenerateCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<AdminCard | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        per_page: "200",
        ...(search.trim() && { search: search.trim() }),
        ...(companyFilter !== "all" && { company_id: companyFilter }),
      });

      if (filter === "claimed") {
        params.set("claim_status", "true");
      } else if (filter === "unclaimed") {
        params.set("claim_status", "false");
      } else if (filter === "assigned") {
        params.set("assignment", "assigned");
      } else if (filter === "unassigned") {
        params.set("assignment", "unassigned");
      } else if (["active", "suspended", "retired"].includes(filter)) {
        params.set("status", filter);
      }

      const response = await apiRequest<{ cards: AdminCard[] }>(`/api/admin/cards?${params}`, {
        headers: getAuthHeaders(),
      });
      setCards(response.cards || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await apiRequest<{ companies: AdminCompany[] }>("/api/admin/companies?per_page=200", {
          headers: getAuthHeaders(),
        });
        setCompanies(response.companies || []);
      } catch {
        setCompanies([]);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchCards();
  }, [filter, companyFilter]);

  const filteredCards = cards.filter((card) => {
    const searchText = search.toLowerCase().trim();
    return (
      card.code.toLowerCase().includes(searchText) ||
      (card.short_code || "").toLowerCase().includes(searchText) ||
      (card.assigned_user?.email || "").toLowerCase().includes(searchText)
    );
  });

  const getCardPath = (card: AdminCard) => card.landing_path || `/card/${card.short_code || card.code}`;

  const getCardUrl = (card: AdminCard) => `${window.location.origin}${getCardPath(card)}`;

  const updateStatus = async (cardId: string, status: string) => {
    try {
      await apiRequest(`/api/admin/cards/${cardId}/status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      toast.success("Card status updated");
      fetchCards();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error updating card");
    }
  };

  const exportCards = () => {
    const rows = [
      ["code", "short_code", "landing_path", "status", "assigned_user_email", "created_at"],
      ...filteredCards.map((card) => [
        card.code,
        card.short_code || "",
        getCardPath(card),
        card.status,
        card.assigned_user?.email || "",
        card.created_at || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-cards.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Cards exported");
  };

  const generateCards = async () => {
    const targetCompanyId = companyFilter !== "all" ? companyFilter : companies[0]?.id;
    if (!targetCompanyId) {
      toast.error("No company available. Create or select a company first.");
      return;
    }

    try {
      setGenerating(true);
      const response = await apiRequestWithFallback<GenerateCardsResponse>([
        () =>
          apiRequest<GenerateCardsResponse>(`/api/admin/companies/${targetCompanyId}/cards/generate`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ count: generateCount }),
          }),
        () =>
          apiRequest<GenerateCardsResponse>(`/api/company/${targetCompanyId}/cards/generate`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ count: generateCount }),
          }),
        () =>
          apiRequest<GenerateCardsResponse>(`/api/admin/cards-create`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ company_id: targetCompanyId, count: generateCount }),
          }),
        () =>
          apiRequest<GenerateCardsResponse>(`/api/admin/cards`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ company_id: targetCompanyId, count: generateCount }),
          }),
        () =>
          apiRequest<GenerateCardsResponse>(`/api/admin/cards/generate`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ company_id: targetCompanyId, count: generateCount }),
          }),
        () =>
          apiRequest<GenerateCardsResponse>(`/api/company/cards/generate`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ company_id: targetCompanyId, count: generateCount }),
          }),
      ]);

      const created = response.cards || [];
      toast.success(`Generated ${created.length} card${created.length === 1 ? "" : "s"}`);

      if (created.length > 0) {
        setSelectedCard(created[0]);
        setQrOpen(true);
      }

      setFilter("unassigned");
      setSearch("");
      if (companyFilter === "all") {
        setCompanyFilter(targetCompanyId);
      }
      await fetchCards();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate cards");
    } finally {
      setGenerating(false);
    }
  };

  const printCardSheet = () => {
    if (filteredCards.length === 0) {
      toast.error("No cards available to print");
      return;
    }

    const printableCards = filteredCards.slice(0, 80);
    const cardsMarkup = printableCards
      .map((card) => {
        const url = getCardUrl(card);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
        return `
          <article class="card-item">
            <img src="${qrUrl}" alt="QR for ${card.code}" class="qr" />
            <div class="meta">
              <p class="code">${card.code}</p>
              <p class="short">${getCardPath(card)}</p>
              <p class="status">${card.status}</p>
            </div>
          </article>
        `;
      })
      .join("");

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>NexTap Card Sheet</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 20px;
            font-family: "Segoe UI", Arial, sans-serif;
            color: #0f172a;
            background: #f8fafc;
          }
          .header {
            margin-bottom: 14px;
            display: flex;
            align-items: baseline;
            justify-content: space-between;
          }
          .title { font-size: 20px; font-weight: 700; }
          .subtitle { font-size: 12px; color: #475569; }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .card-item {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            padding: 10px;
            page-break-inside: avoid;
            display: grid;
            grid-template-columns: 86px 1fr;
            gap: 10px;
            align-items: center;
          }
          .qr {
            width: 86px;
            height: 86px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .meta { min-width: 0; }
          .code {
            margin: 0;
            font-family: Consolas, monospace;
            font-size: 12px;
            font-weight: 700;
          }
          .short {
            margin: 4px 0 0;
            font-family: Consolas, monospace;
            font-size: 11px;
            color: #0f766e;
            word-break: break-all;
          }
          .status {
            margin: 6px 0 0;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
          }
          @media print {
            body { background: #fff; padding: 8mm; }
            .grid { gap: 8px; }
            .card-item { border-color: #94a3b8; }
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="title">NexTap Card Provisioning Sheet</div>
          <div class="subtitle">${new Date().toLocaleString()} · ${printableCards.length} cards</div>
        </header>
        <section class="grid">${cardsMarkup}</section>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
    if (!printWindow) {
      toast.error("Unable to open print preview");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "claimed": return "bg-accent/10 text-accent border-0";
      case "unassigned": return "bg-secondary text-muted-foreground border-0";
      case "suspended": return "bg-destructive/10 text-destructive border-0";
      case "retired": return "bg-gray-100 text-gray-700 border-0";
      default: return "";
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Cards</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cards.length} total cards</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            max={100}
            value={generateCount}
            onChange={(event) => setGenerateCount(Math.max(1, Math.min(100, Number(event.target.value) || 1)))}
            className="w-24 h-9"
          />
          <Button variant="outline" size="sm" onClick={fetchCards}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={printCardSheet}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Sheet
          </Button>
          <Button variant="outline" size="sm" onClick={exportCards}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={generateCards} disabled={generating}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> {generating ? "Generating..." : "Generate Cards"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={companyFilter}
          onChange={(event) => setCompanyFilter(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search cards or users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "claimed", "unclaimed", "assigned", "unassigned", "active", "suspended", "retired"].map((value) => (
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
        <Card className="p-8 text-center text-muted-foreground">Loading cards...</Card>
      ) : filteredCards.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No cards found</Card>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Public Link</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Views</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => (
                <tr key={card.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">{card.code}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-mono text-xs text-foreground">{getCardPath(card)}</p>
                    <p className="text-xs text-muted-foreground">{card.short_code || "legacy"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${statusColor(card.status)} capitalize text-xs`}>{card.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {card.assigned_user ? (
                      <div>
                        <p className="text-foreground font-medium text-xs">{card.assigned_user.first_name} {card.assigned_user.last_name}</p>
                        <p className="text-xs text-muted-foreground">{card.assigned_user.email}</p>
                      </div>
                    ) : <span>—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {card.tracking?.total_views ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                    {card.created_at ? new Date(card.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          navigator.clipboard.writeText(card.code);
                          toast.success("Card code copied");
                        }}>
                          Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          navigator.clipboard.writeText(getCardUrl(card));
                          toast.success("Card link copied");
                        }}>
                          <Link2 className="w-3.5 h-3.5 mr-2" /> Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedCard(card);
                          setQrOpen(true);
                        }}>
                          <QrCode className="w-3.5 h-3.5 mr-2" /> View QR
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/cards/${card.id}`}>View Tracking</Link>
                        </DropdownMenuItem>
                        {!card.claim_status && (
                          <DropdownMenuItem onClick={() => updateStatus(card.id, card.status === "active" ? "suspended" : "active")}>{card.status === "active" ? "Suspend" : "Activate"}</DropdownMenuItem>
                        )}
                        {!card.claim_status && card.status !== "retired" && <DropdownMenuItem onClick={() => updateStatus(card.id, "retired")} className="text-destructive">Retire</DropdownMenuItem>}
                        {card.claim_status && <DropdownMenuItem disabled>Locked to customer</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Card QR Code</DialogTitle>
            <DialogDescription>Write this short URL to NFC and print/use this QR code.</DialogDescription>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 bg-secondary/30 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(getCardUrl(selectedCard))}`}
                  alt="Card QR Code"
                  className="h-56 w-56 rounded"
                />
              </div>
              <div className="rounded-md border border-border p-3 bg-background">
                <p className="text-xs text-muted-foreground">Short link</p>
                <p className="text-sm font-mono break-all">{getCardUrl(selectedCard)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrOpen(false)}>Close</Button>
            {selectedCard && (
              <Button onClick={() => {
                navigator.clipboard.writeText(getCardUrl(selectedCard));
                toast.success("Card link copied");
              }}>
                Copy Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminCards;