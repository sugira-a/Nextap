import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

type AdminCard = {
  id: string;
  code: string;
  short_code?: string;
  landing_path?: string;
  status: string;
  claim_status: boolean;
  serial_number?: string | null;
  created_at?: string | null;
  assigned_user?: { id: string; first_name: string; last_name: string; email: string } | null;
  company?: { id: string; name: string; slug?: string } | null;
  scope?: "company" | "personal";
};

type AdminCompany = { id: string; name: string };
type GenerateCardsResponse = { message: string; cards: AdminCard[] };

const AdminCards = () => {
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [generateCount, setGenerateCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generationScope, setGenerationScope] = useState<"company" | "personal">("company");
  const [generationCompanyId, setGenerationCompanyId] = useState("");
  const [qrCard, setQrCard] = useState<AdminCard | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        per_page: "200",
        ...(search.trim() && { search: search.trim() }),
        ...(companyFilter !== "all" && { company_id: companyFilter }),
      });

      if (filter === "claimed") params.set("claim_status", "true");
      else if (filter === "unclaimed") params.set("claim_status", "false");
      else if (filter === "assigned") params.set("assignment", "assigned");
      else if (filter === "unassigned") params.set("assignment", "unassigned");
      else if (filter === "personal") params.set("scope", "personal");
      else if (["active", "suspended", "retired"].includes(filter)) params.set("status", filter);

      const res = await apiRequest<{ cards: AdminCard[] }>(`/api/admin/cards?${params.toString()}`, { headers: authHeaders });
      setCards(res.cards || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest<{ companies: AdminCompany[] }>("/api/admin/companies?per_page=200", { headers: authHeaders })
      .then(response => setCompanies(response.companies || []))
      .catch(() => {});
  }, [authHeaders]);

  useEffect(() => {
    fetchCards();
  }, [filter, companyFilter]);

  const filteredCards = cards.filter(card => {
    const term = search.toLowerCase().trim();
    return (
      card.code.toLowerCase().includes(term) ||
      (card.short_code || "").toLowerCase().includes(term) ||
      (card.assigned_user?.email || "").toLowerCase().includes(term)
    );
  });

  const selectedCompanyName = companies.find(company => company.id === generationCompanyId)?.name || "";

  const getCardPath = (card: AdminCard) => card.landing_path || `/card/${card.short_code || card.code}`;
  const getCardUrl = (card: AdminCard) => `${window.location.origin}${getCardPath(card)}`;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
    toast.success(`${label} copied`);
  };

  const exportCards = () => {
    const rows = [
      ["code", "short_code", "landing_path", "status", "scope", "company", "assigned_user_email", "created_at"],
      ...filteredCards.map(card => [
        card.code,
        card.short_code || "",
        getCardPath(card),
        card.status,
        card.scope || (card.company ? "company" : "personal"),
        card.company?.name || "",
        card.assigned_user?.email || "",
        card.created_at || "",
      ]),
    ];

    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const anchor = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "admin-cards.csv",
    });
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    toast.success("Exported");
  };

  const updateStatus = async (cardId: string, status: string) => {
    try {
      await apiRequest(`/api/admin/cards/${cardId}/status`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success("Status updated");
      fetchCards();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error updating card");
    }
  };

  const generateCards = async () => {
    if (generationScope === "company" && !generationCompanyId) {
      toast.error("Select a company first");
      return;
    }

    try {
      setGenerating(true);
      const res = await apiRequest<GenerateCardsResponse>("/api/admin/cards/generate", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          count: generateCount,
          scope: generationScope,
          company_id: generationScope === "company" ? generationCompanyId : undefined,
        }),
      });

      const created = res.cards || [];
      toast.success(`Generated ${created.length} card${created.length !== 1 ? "s" : ""}`);
      if (created.length > 0) setQrCard(created[0]);
      setFilter(generationScope === "personal" ? "personal" : "unassigned");
      if (generationScope === "company") setCompanyFilter(generationCompanyId);
      setGeneratorOpen(false);
      fetchCards();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate cards");
    } finally {
      setGenerating(false);
    }
  };

  const printCardSheet = () => {
    if (filteredCards.length === 0) {
      toast.error("No cards to print");
      return;
    }

    const markup = filteredCards.slice(0, 80).map(card => {
      const url = getCardUrl(card);
      return `<article class="card-item"><img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}" class="qr" /><div class="meta"><p class="code">${card.code}</p><p class="short">${getCardPath(card)}</p><p class="status">${card.status}</p></div></article>`;
    }).join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>NexTap Card Sheet</title><style>*{box-sizing:border-box}body{margin:0;padding:20px;font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;background:#f8fafc}.title{font-size:20px;font-weight:700;margin-bottom:14px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card-item{border:1px solid #cbd5e1;border-radius:10px;background:#fff;padding:10px;page-break-inside:avoid;display:grid;grid-template-columns:86px 1fr;gap:10px;align-items:center}.qr{width:86px;height:86px;border-radius:8px;border:1px solid #e2e8f0}.code{margin:0;font-family:Consolas,monospace;font-size:12px;font-weight:700}.short{margin:4px 0 0;font-family:Consolas,monospace;font-size:11px;color:#0f766e;word-break:break-all}.status{margin:6px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b}@media print{body{background:#fff;padding:8mm}}</style></head><body><div class="title">NexTap Card Sheet · ${new Date().toLocaleDateString()}</div><section class="grid">${markup}</section></body></html>`;

    const w = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
    if (!w) {
      toast.error("Unable to open print preview");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      w.focus();
      w.print();
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-8 py-2"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-zinc-200 pb-6 gap-4 sm:gap-0">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Admin</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Cards</h1>
          <p className="text-sm text-zinc-400 mt-1">{cards.length} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <input
            type="number"
            min={1}
            max={100}
            value={generateCount}
            onChange={e => setGenerateCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-16 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-center outline-none focus:border-zinc-500 transition-colors"
          />
          <button onClick={printCardSheet} className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">Print</button>
          <button onClick={exportCards} className="text-sm border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">Export CSV</button>
          <button onClick={() => setGeneratorOpen(true)} className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50 shrink-0">
            Create Cards
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-500 transition-colors"
        >
          <option value="all">All Companies</option>
          {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>

        <input
          type="text"
          placeholder="Search cards or users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchCards()}
          className="flex-1 min-w-48 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
        />

        <div className="flex gap-1.5 bg-zinc-100 rounded-lg p-1 overflow-x-auto sm:overflow-visible flex-wrap sm:flex-nowrap">
          {(["all", "claimed", "unclaimed", "assigned", "unassigned", "personal", "active", "suspended", "retired"] as const).map(value => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors capitalize shrink-0 ${filter === value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-zinc-400">No cards found</div>
        ) : (
          <>
            <div className="hidden md:block divide-y divide-zinc-100">
              <div className="grid grid-cols-12 px-6 py-3 bg-zinc-50 border-b border-zinc-100">
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Code</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Claimed</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Scope</span>
                <span className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Assigned User</span>
                <span className="col-span-1 text-xs font-medium text-zinc-400 uppercase tracking-wide">Created</span>
                <span className="col-span-1 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">QR</span>
              </div>

              {filteredCards.map(card => (
                <div key={card.id} className="grid grid-cols-12 px-6 py-3.5 hover:bg-zinc-50 transition-colors items-center group">
                  <div className="col-span-2 flex items-center gap-2">
                    <Link to={`/admin/cards/${card.id}`} className="font-mono text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors">{card.code}</Link>
                    <button onClick={() => copyText(card.code, card.code)} className="text-[10px] text-zinc-300 group-hover:text-zinc-400 transition-colors">
                      {copied === card.code ? "✓" : "copy"}
                    </button>
                  </div>

                  <div className="col-span-2">
                    <select
                      value={card.status}
                      onChange={e => updateStatus(card.id, e.target.value)}
                      disabled={card.claim_status}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer disabled:cursor-default ${
                        card.status === "active" ? "bg-emerald-50 text-emerald-700" :
                        card.status === "suspended" ? "bg-red-50 text-red-600" :
                        card.status === "retired" ? "bg-zinc-200 text-zinc-500" :
                        "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {["active", "unassigned", "assigned", "personal", "suspended", "retired"].map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.claim_status ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {card.claim_status ? "Claimed" : "Free"}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.scope === "personal" || !card.company ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>
                      {card.scope === "personal" || !card.company ? "Personal" : card.company?.name || "Company"}
                    </span>
                  </div>

                  <div className="col-span-2 text-sm min-w-0">
                    {card.assigned_user ? (
                      <Link to={`/admin/users/${card.assigned_user.id}`} className="hover:text-zinc-600 transition-colors">
                        <p className="text-zinc-900 font-medium truncate">{card.assigned_user.first_name} {card.assigned_user.last_name}</p>
                        <p className="text-xs text-zinc-400 truncate">{card.assigned_user.email}</p>
                      </Link>
                    ) : <span className="text-xs text-zinc-400">Unassigned</span>}
                  </div>

                  <div className="col-span-1 text-xs text-zinc-400">
                    {card.created_at ? new Date(card.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "-"}
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => setQrCard(card)}
                      className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2 py-1 rounded-lg transition-colors"
                      title="View QR"
                    >
                      QR
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:hidden divide-y divide-zinc-100">
              {filteredCards.map(card => (
                <div key={card.id} className="p-4 hover:bg-zinc-50 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/cards/${card.id}`} className="font-mono text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors block truncate">{card.code}</Link>
                      <p className="text-xs text-zinc-400 mt-1">{card.created_at ? new Date(card.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "-"}</p>
                    </div>
                    <button
                      onClick={() => setQrCard(card)}
                      className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                      title="View QR"
                    >
                      QR
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={card.status}
                      onChange={e => updateStatus(card.id, e.target.value)}
                      disabled={card.claim_status}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer disabled:cursor-default ${
                        card.status === "active" ? "bg-emerald-50 text-emerald-700" :
                        card.status === "suspended" ? "bg-red-50 text-red-600" :
                        card.status === "retired" ? "bg-zinc-200 text-zinc-500" :
                        "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {["active", "unassigned", "assigned", "personal", "suspended", "retired"].map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.claim_status ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {card.claim_status ? "Claimed" : "Free"}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.scope === "personal" || !card.company ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>
                      {card.scope === "personal" || !card.company ? "Personal" : card.company?.name || "Company"}
                    </span>
                  </div>

                  {card.assigned_user && (
                    <Link to={`/admin/users/${card.assigned_user.id}`} className="block text-xs hover:text-zinc-600 transition-colors">
                      <p className="text-zinc-900 font-medium">{card.assigned_user.first_name} {card.assigned_user.last_name}</p>
                      <p className="text-xs text-zinc-400 truncate">{card.assigned_user.email}</p>
                    </Link>
                  )}

                  <button onClick={() => copyText(card.code, card.code)} className="w-full text-xs border border-zinc-200 rounded-lg py-2 text-zinc-500 hover:bg-zinc-50 transition-colors">
                    {copied === card.code ? "✓ Copied" : "Copy Code"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {generatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => !generating && setGeneratorOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-zinc-900 mb-1">Create Cards</p>
            <p className="text-xs text-zinc-400 mb-5">Choose where these cards should live before generating them.</p>

            <div className="mb-4">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-2">Destination</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGenerationScope("company")}
                  className={`rounded-xl border px-4 py-3 text-sm transition-colors ${generationScope === "company" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                >
                  Company
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationScope("personal")}
                  className={`rounded-xl border px-4 py-3 text-sm transition-colors ${generationScope === "personal" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                >
                  Personal
                </button>
              </div>
            </div>

            {generationScope === "company" && (
              <div className="mb-4">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Company</label>
                <select
                  value={generationCompanyId}
                  onChange={e => setGenerationCompanyId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                >
                  <option value="">Choose a company...</option>
                  {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
                {selectedCompanyName && <p className="mt-2 text-xs text-zinc-400">Selected: {selectedCompanyName}</p>}
              </div>
            )}

            {generationScope === "personal" && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Personal cards will not appear in company dashboards.
              </div>
            )}

            <div className="mb-5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">Count</label>
              <input
                type="number"
                min={1}
                max={100}
                value={generateCount}
                onChange={e => setGenerateCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGeneratorOpen(false)}
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateCards}
                disabled={generating}
                className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {generating ? "Creating..." : "Create Cards"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {qrCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setQrCard(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-zinc-900 mb-1">Card QR Code</p>
            <p className="text-xs text-zinc-400 mb-4 font-mono">{qrCard.code}</p>
            <div className="flex justify-center mb-4">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getCardUrl(qrCard))}`} alt="QR Code" className="rounded-xl border border-zinc-100" />
            </div>
            <p className="text-xs text-zinc-400 font-mono text-center break-all mb-4">{getCardUrl(qrCard)}</p>
            <div className="flex gap-2">
              <button onClick={() => setQrCard(null)} className="flex-1 text-sm border border-zinc-200 rounded-xl py-2.5 text-zinc-500 hover:bg-zinc-50 transition-colors">Close</button>
              <button onClick={() => copyText(getCardUrl(qrCard), "Link")} className="flex-1 bg-zinc-900 text-white text-sm rounded-xl py-2.5 hover:bg-zinc-700 transition-colors">
                {copied === "Link" ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminCards;
