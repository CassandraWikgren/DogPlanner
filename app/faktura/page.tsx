"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Loader2, Lock, Unlock, PlusCircle, FileText } from "lucide-react";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
  CALCULATION: "[ERR-7001]",
} as const;

// TypeScript-typer för fakturasidan - följer Supabase snake_case konventioner
type Owner = {
  id: string;
  full_name: string | null;
  customer_number: number | null;
  phone: string | null;
  email: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

type Organization = {
  id: string;
  name: string | null;
  org_number: string | null;
  email: string | null;
  phone: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

type Invoice = {
  id: string;
  org_id: string | null;
  owner_id: string | null;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: "draft" | "sent" | "paid" | "cancelled";
  billed_name: string | null;
  billed_email: string | null;
  billed_address: string | null;
  billed_city?: string | null;
  billed_postal_code?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  owners?: Owner;
  organizations?: Organization;
};

type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  tax_rate?: number;
  created_at?: string;
};

const DEFAULT_COLUMNS = [
  "customer_number",
  "customer_name",
  "invoice_date",
  "due_date",
  "total_amount",
  "status",
  "actions",
];

const FakturorPage = () => {
  const supabase = createClientComponentClient();

  // 🧠 Statehantering
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [locked, setLocked] = useState(false);
  const [creating, setCreating] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
    dueSoon: 0,
  });
  const [online, setOnline] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<keyof Invoice>("invoice_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(DEFAULT_COLUMNS);

  // 🪵 Felsökningslogg – sparar i localStorage
  // Hydration-säker initialisering
  useEffect(() => {
    setMounted(true);
    // Läs localStorage efter mount för att undvika hydration errors
    try {
      const saved = localStorage.getItem("faktura-visible-columns");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVisibleColumns(parsed);
        }
      }
    } catch (error) {
      console.warn("[ERR-3004] Korrupt kolumndata, använder default:", error);
    }

    // Läs även debugLogs från localStorage
    try {
      const debugRaw = localStorage.getItem("debugLogs");
      if (debugRaw) {
        const parsed = JSON.parse(debugRaw);
        if (Array.isArray(parsed)) {
          setDebugLogs(parsed);
        }
      }
    } catch (error) {
      console.warn("[ERR-3005] Korrupt debug log data:", error);
    }
  }, []);

  function logDebug(
    type: "info" | "success" | "error",
    message: string,
    details?: any
  ) {
    console.log(`[Fakturor] ${message}`, details || "");
    const newLog = { time: new Date().toISOString(), type, message, details };

    // Bara spara till localStorage efter mount för att undvika hydration error
    if (!mounted) {
      setDebugLogs((prev) => [newLog, ...prev].slice(0, 100));
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem("debugLogs") || "[]");
      const updated = [newLog, ...existing].slice(0, 100);
      localStorage.setItem("debugLogs", JSON.stringify(updated));
      setDebugLogs(updated);
    } catch (error) {
      console.error("[ERR-3002] Fel vid sparande av debug logs:", error);
      setDebugLogs([newLog]); // Endast i minnet
    }
  }

  // 📦 Hämta fakturor (inkl. kund + org)
  async function loadInvoices() {
    try {
      setLoading(true);
      logDebug("info", "Hämtar fakturor…");

      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          id, org_id, owner_id, invoice_date, due_date, total_amount, status,
          billed_name, billed_email, billed_address, billed_city, billed_postal_code,
          invoice_number, notes, created_at, updated_at,
          owners(id, full_name, customer_number, phone, email, address, city, postal_code),
          organizations(id, name, org_number, email, phone, address, city, postal_code)
        `
        )
        .order("invoice_date", { ascending: false });

      if (error) {
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte hämta fakturor: ${error.message}`
        );
      }

      // Process the data to handle the array relations
      const processedData =
        data?.map((invoice: any) => ({
          ...invoice,
          owners: Array.isArray(invoice.owners)
            ? invoice.owners[0]
            : invoice.owners,
          organizations: Array.isArray(invoice.organizations)
            ? invoice.organizations[0]
            : invoice.organizations,
        })) || [];
      setInvoices(processedData);
      setFiltered(processedData);
      logDebug("success", `Fakturor laddade: ${processedData.length} st`);
      calcTotals(processedData);
    } catch (err: any) {
      const errorMsg =
        err.message ||
        `${ERROR_CODES.DATABASE} Okänt fel vid hämtning av fakturor`;
      toast(errorMsg, "error");
      logDebug("error", "Fel vid hämtning av fakturor", err);
    } finally {
      setLoading(false);
    }
  }

  // 🧾 Hämta fakturarader (invoice_items)
  async function loadItems() {
    try {
      logDebug("info", "Hämtar fakturarader…");
      const { data, error } = await supabase
        .from("invoice_items")
        .select(
          "id, invoice_id, description, quantity, unit_price, total_amount, tax_rate, created_at"
        );

      if (error) {
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte hämta fakturarader: ${error.message}`
        );
      }

      setItems(data || []);
      logDebug("success", `Fakturarader laddade: ${data?.length || 0} st`);
    } catch (err: any) {
      logDebug("error", "Fel vid hämtning av fakturarader", err);
      toast(
        `${ERROR_CODES.DATABASE} Fel vid hämtning av fakturarader: ${err.message}`,
        "error"
      );
    }
  }

  // 💰 Beräkna totalsummor
  function calcTotals(data: Invoice[]) {
    const total = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paid = data
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const unpaid = total - paid;

    // Beräkna förfallna fakturor
    const now = new Date();
    const overdue = data
      .filter((inv) => inv.status !== "paid" && new Date(inv.due_date) < now)
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    const dueSoon = data
      .filter((inv) => {
        if (inv.status === "paid") return false;
        const dueDate = new Date(inv.due_date);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilDue >= 0 && daysUntilDue <= 7;
      })
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    setTotals({ total, paid, unpaid, overdue, dueSoon });
  }

  // 🔍 Filtrering vid sökning - förbättrad med fler sökbara fält
  useEffect(() => {
    let filteredData = [...invoices];

    // Månadsfiltrering
    if (selectedMonth && selectedMonth !== "all") {
      filteredData = filteredData.filter((inv) => {
        const invoiceMonth = inv.invoice_date.substring(0, 7); // YYYY-MM format
        return invoiceMonth === selectedMonth;
      });
    }

    // Statusfiltrering
    if (statusFilter && statusFilter !== "all") {
      filteredData = filteredData.filter((inv) => inv.status === statusFilter);
    }

    // Textfiltrering
    if (search) {
      const searchTerm = search.toLowerCase().trim();
      filteredData = filteredData.filter((inv) => {
        // Sökning i kundinformation
        const customerMatch =
          inv.billed_name?.toLowerCase().includes(searchTerm) ||
          inv.owners?.full_name?.toLowerCase().includes(searchTerm) ||
          inv.billed_email?.toLowerCase().includes(searchTerm) ||
          inv.owners?.email?.toLowerCase().includes(searchTerm) ||
          (inv.owners?.customer_number &&
            inv.owners.customer_number.toString().includes(searchTerm));

        // Sökning i organisationsinformation
        const orgMatch =
          inv.organizations?.name?.toLowerCase().includes(searchTerm) ||
          inv.organizations?.org_number?.includes(searchTerm);

        // Sökning i fakturanummer och status
        const invoiceMatch =
          inv.invoice_number?.toLowerCase().includes(searchTerm) ||
          inv.status.toLowerCase().includes(searchTerm) ||
          inv.id.toLowerCase().includes(searchTerm);

        // Sökning i belopp (konverterat till string)
        const amountMatch = inv.total_amount.toString().includes(searchTerm);

        return customerMatch || orgMatch || invoiceMatch || amountMatch;
      });
    }

    // Sortering
    filteredData = sortInvoices(filteredData);

    setFiltered(filteredData);
    calcTotals(filteredData);

    logDebug(
      "info",
      `Filtrering: ${filteredData.length} av ${invoices.length} fakturor visas (månad: ${selectedMonth}, status: ${statusFilter}, sök: "${search}")`
    );
  }, [search, invoices, selectedMonth, statusFilter, sortBy, sortOrder]);

  // 🖱️ Stäng dropdown när man klickar utanför
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdown = document.getElementById("column-dropdown");
      const button = event.target as HTMLElement;

      if (
        dropdown &&
        !dropdown.contains(button) &&
        !button.closest("[data-column-toggle]")
      ) {
        dropdown.classList.add("hidden");
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 🧭 Initiering – ladda data och starta realtidslyssning
  useEffect(() => {
    loadInvoices();
    loadItems();

    // Starta realtidslyssning för fakturor
    const channel = supabase
      .channel("invoice_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        (payload) => {
          logDebug(
            "info",
            `Realtidsuppdatering mottagen: ${payload.eventType}`,
            payload
          );
          loadInvoices();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoice_items" },
        (payload) => {
          logDebug(
            "info",
            `Fakturarader uppdaterade: ${payload.eventType}`,
            payload
          );
          loadItems();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logDebug(
            "success",
            `${ERROR_CODES.REALTIME} Realtidslyssning aktiv för fakturor och fakturarader`
          );
          setOnline(true);
        } else if (status === "CHANNEL_ERROR") {
          logDebug(
            "error",
            `${ERROR_CODES.REALTIME} Fel vid realtidslyssning`,
            status
          );
          setOnline(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      logDebug("info", "Realtidslyssning avslutad");
    };
  }, []);

  // 🔒 Lås / lås upp månad
  async function toggleLock() {
    try {
      const newLocked = !locked;
      setLocked(newLocked);
      const message = newLocked
        ? "Månad låst - Månaden är låst för ändringar."
        : "Månad upplåst - Du kan nu lägga till nya fakturor.";
      toast(message, "info");
      logDebug("info", newLocked ? "Månad låst" : "Månad upplåst");
    } catch (err: any) {
      const errorMsg = `${ERROR_CODES.VALIDATION} Fel vid låsning: ${err.message}`;
      toast(errorMsg, "error");
      logDebug("error", "Fel vid låsning", err);
    }
  }

  // ➕ Skapa ny faktura (manuell)
  async function createInvoice(ownerId: string, belopp: number) {
    try {
      setCreating(true);
      logDebug(
        "info",
        `Skapar ny faktura för kund ${ownerId}, belopp: ${belopp} kr`
      );

      if (!ownerId || isNaN(belopp) || belopp <= 0) {
        throw new Error(
          `${ERROR_CODES.VALIDATION} Ogiltiga värden: kund-ID och belopp måste anges`
        );
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // 🔔 org_id (och user_id) sätts av triggers i databasen
      const { error } = await supabase.from("invoices").insert({
        owner_id: ownerId,
        invoice_date: new Date().toISOString(),
        due_date: dueDate.toISOString(),
        total_amount: belopp,
        status: "draft",
      });

      if (error) {
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte skapa faktura: ${error.message}`
        );
      }

      toast("Faktura skapad framgångsrikt", "success");
      logDebug("success", `Faktura skapad för kund ${ownerId}`);
      loadInvoices();
    } catch (err: any) {
      const errorMsg =
        err.message ||
        `${ERROR_CODES.DATABASE} Okänt fel vid skapande av faktura`;
      toast(errorMsg, "error");
      logDebug("error", "Fel vid skapande av faktura", err);
    } finally {
      setCreating(false);
    }
  }

  // 🧾 Generera PDF (anropar Edge Function)
  async function exportPDF(invoiceId: string) {
    try {
      logDebug("info", `Startar PDF-export för faktura ${invoiceId}`);
      toast("Genererar PDF…", "info");

      const { data, error } = await supabase.functions.invoke("pdf", {
        body: { invoiceId },
      });

      if (error) {
        throw new Error(
          `${ERROR_CODES.PDF_EXPORT} PDF-generering misslyckades: ${error.message}`
        );
      }

      toast("PDF genererad framgångsrikt", "success");
      logDebug("success", `PDF skapad för faktura ${invoiceId}`, data);
      loadInvoices();
    } catch (err: any) {
      const errorMsg =
        err.message || `${ERROR_CODES.PDF_EXPORT} Okänt fel vid PDF-export`;
      toast(errorMsg, "error");
    }
  }

  // 📊 CSV-export funktioner
  function generateCSVExport(data: Invoice[]): string {
    const columnMapping: Record<
      string,
      { header: string; getValue: (inv: Invoice) => string }
    > = {
      customer_number: {
        header: "Kundnummer",
        getValue: (inv) => inv.owners?.customer_number?.toString() || "",
      },
      customer_name: {
        header: "Kund",
        getValue: (inv) => inv.owners?.full_name || inv.billed_name || "",
      },
      organization: {
        header: "Organisation",
        getValue: (inv) => inv.organizations?.name || "",
      },
      invoice_date: {
        header: "Fakturadatum",
        getValue: (inv) =>
          new Date(inv.invoice_date).toLocaleDateString("sv-SE"),
      },
      due_date: {
        header: "Förfallodatum",
        getValue: (inv) => new Date(inv.due_date).toLocaleDateString("sv-SE"),
      },
      total_amount: {
        header: "Belopp",
        getValue: (inv) => inv.total_amount.toString(),
      },
      status: {
        header: "Status",
        getValue: (inv) => getStatusLabel(inv.status),
      },
      invoice_number: {
        header: "Fakturanummer",
        getValue: (inv) => inv.invoice_number || "",
      },
    };

    // Filtrera på synliga kolumner (exkludera 'actions')
    const exportColumns = visibleColumns.filter(
      (col) => col !== "actions" && columnMapping[col]
    );
    const headers = exportColumns.map((col) => columnMapping[col].header);

    const rows = data.map((inv) =>
      exportColumns.map((col) => columnMapping[col].getValue(inv))
    );

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }

  function downloadCSV(csvData: string, filename: string): void {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // 📅 Hjälpfunktioner för månadsfiltrering
  function generateMonthOptions(): { value: string; label: string }[] {
    const options = [];
    const today = new Date();

    // Generera de senaste 12 månaderna
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const label = date.toLocaleDateString("sv-SE", {
        year: "numeric",
        month: "long",
      });
      options.push({ value, label });
    }

    return options;
  }

  function getMonthName(monthValue: string): string {
    if (monthValue === "all") return "Alla månader";
    const [year, month] = monthValue.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("sv-SE", { year: "numeric", month: "long" });
  }

  function getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      draft: "Utkast",
      sent: "Skickad",
      paid: "Betald",
      cancelled: "Makulerad",
      all: "Alla status",
    };
    return statusLabels[status] || status;
  }

  // 🔄 Sorteringsfunktioner
  function handleSort(column: keyof Invoice) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    logDebug(
      "info",
      `Sorterar efter ${column} i ${
        sortOrder === "asc" ? "desc" : "asc"
      } ordning`
    );
  }

  function sortInvoices(invoices: Invoice[]): Invoice[] {
    return [...invoices].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Specialhantering för nested properties
      if (sortBy === "owners" && a.owners && b.owners) {
        aValue = a.owners.full_name || a.billed_name || "";
        bValue = b.owners.full_name || b.billed_name || "";
      } else if (
        sortBy === "organizations" &&
        a.organizations &&
        b.organizations
      ) {
        aValue = a.organizations.name || "";
        bValue = b.organizations.name || "";
      }

      // Hantera null/undefined värden
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Numerisk sortering för belopp
      if (sortBy === "total_amount") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Datumsortering
      if (sortBy === "invoice_date" || sortBy === "due_date") {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Textsortering
      const stringA = String(aValue).toLowerCase();
      const stringB = String(bValue).toLowerCase();

      if (sortOrder === "asc") {
        return stringA.localeCompare(stringB, "sv-SE");
      } else {
        return stringB.localeCompare(stringA, "sv-SE");
      }
    });
  }

  // 👁️ Kolumnhantering
  const availableColumns = [
    { key: "customer_number", label: "Kundnr" },
    { key: "customer_name", label: "Kund" },
    { key: "organization", label: "Organisation" },
    { key: "invoice_date", label: "Fakturadatum" },
    { key: "due_date", label: "Förfallodatum" },
    { key: "total_amount", label: "Belopp" },
    { key: "status", label: "Status" },
    { key: "invoice_number", label: "Fakturanr" },
    { key: "actions", label: "Åtgärder" },
  ];

  function toggleColumn(columnKey: string) {
    const newColumns = visibleColumns.includes(columnKey)
      ? visibleColumns.filter((col) => col !== columnKey)
      : [...visibleColumns, columnKey];

    setVisibleColumns(newColumns);

    // Bara spara till localStorage efter mount
    if (mounted) {
      localStorage.setItem(
        "faktura-visible-columns",
        JSON.stringify(newColumns)
      );
    }
    logDebug(
      "info",
      `Kolumnsynlighet uppdaterad: ${columnKey} ${
        visibleColumns.includes(columnKey) ? "dold" : "visad"
      }`
    );
  }

  function isColumnVisible(columnKey: string): boolean {
    return visibleColumns.includes(columnKey);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                💸 Fakturor och underlag
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Hantera fakturor för hunddagis, pensionat och frisör.
              </p>
            </div>
            <div className="flex gap-3 ml-4">
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600">Fakturor</div>
                <div className="text-xl font-bold text-[#2c7a4c]">
                  {invoices.length}
                </div>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600">Totalt</div>
                <div className="text-xl font-bold text-[#2c7a4c]">
                  {totals.total.toLocaleString()} kr
                </div>
              </div>
              <span
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  online
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {online ? "🟢 Online" : "🔴 Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading && (
          <div className="flex items-center gap-2 text-gray-600 mb-6 text-sm">
            <Loader2 className="animate-spin" /> Laddar fakturor…
          </div>
        )}

        {/* Knappar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              const csvData = generateCSVExport(filtered);
              downloadCSV(
                csvData,
                `fakturor-${new Date().toISOString().split("T")[0]}.csv`
              );
              logDebug(
                "success",
                `CSV-export skapad med ${filtered.length} fakturor`
              );
              toast("CSV-fil exporterad", "success");
            }}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold text-sm flex items-center gap-2"
          >
            <FileText size={16} />
            Exportera CSV
          </button>

          <button
            onClick={toggleLock}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold text-sm flex items-center gap-2"
          >
            {locked ? <Unlock size={16} /> : <Lock size={16} />}
            {locked ? "Avlås månad" : "Lås månad"}
          </button>
          <button
            onClick={() => setCreating(true)}
            disabled={locked}
            className="px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle size={16} /> Ny faktura
          </button>
        </div>

        {/* 💰 Summeringsrutor */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-center mb-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-gray-600 text-sm font-semibold">💰 Totalt</h2>
            <p className="text-lg font-bold">
              {totals.total.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-gray-600 text-sm font-semibold">✅ Betalt</h2>
            <p className="text-lg font-bold text-emerald-700">
              {totals.paid.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-gray-600 text-sm font-semibold">
              🕓 Ej betalt
            </h2>
            <p className="text-lg font-bold text-blue-600">
              {totals.unpaid.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-gray-600 text-sm font-semibold">
              ⚠️ Förfallet
            </h2>
            <p className="text-lg font-bold text-red-600">
              {totals.overdue.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-gray-600 text-sm font-semibold">
              ⏰ Förfaller snart
            </h2>
            <p className="text-lg font-bold text-orange-600">
              {totals.dueSoon.toLocaleString("sv-SE")} kr
            </p>
          </div>
        </div>

        {/* 🔍 Sök- och filtreringsfält */}
        <div className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Sökfält */}
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Sök kund, faktura, belopp eller status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold text-sm"
                >
                  Rensa
                </button>
              )}
            </div>

            {/* Månadsfilter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">Alla månader</option>
              {generateMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Statusfilter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">Alla status</option>
              <option value="draft">Utkast</option>
              <option value="sent">Skickad</option>
              <option value="paid">Betald</option>
              <option value="cancelled">Makulerad</option>
            </select>

            {/* Kolumnval */}
            <div className="relative">
              <button
                data-column-toggle
                onClick={() => {
                  const dropdown = document.getElementById("column-dropdown");
                  if (dropdown) {
                    dropdown.classList.toggle("hidden");
                  }
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold text-sm flex items-center gap-2"
              >
                Kolumner ({visibleColumns.length})
              </button>
              <div
                id="column-dropdown"
                className="hidden absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-2 min-w-[200px]"
              >
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Välj synliga kolumner:
                </div>
                {availableColumns.map((column) => (
                  <label
                    key={column.key}
                    className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isColumnVisible(column.key)}
                      onChange={() => toggleColumn(column.key)}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-sm">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Filtreringsresultat */}
          {(search || selectedMonth !== "all" || statusFilter !== "all") && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              Visar {filtered.length} av {invoices.length} fakturor
              {search && ` som matchar "${search}"`}
              {selectedMonth !== "all" && ` för ${getMonthName(selectedMonth)}`}
              {statusFilter !== "all" &&
                ` med status "${getStatusLabel(statusFilter)}"`}
            </div>
          )}
        </div>

        {/* 💵 Prisöversikt (accordion) */}
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-emerald-700 font-medium">
              💰 Visa prisöversikt
            </AccordionTrigger>
            <AccordionContent className="bg-white border rounded-md shadow-sm p-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Hunddagis */}
                <div>
                  <h3 className="font-semibold text-green-700 mb-2">
                    🐾 Hunddagis
                  </h3>
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-600 border-b">
                      <tr>
                        <th>Tjänst</th>
                        <th className="text-right">Pris</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Dagis heltid</td>
                        <td className="text-right">3 990 kr/mån</td>
                      </tr>
                      <tr>
                        <td>Dagis deltid 2</td>
                        <td className="text-right">2 990 kr/mån</td>
                      </tr>
                      <tr>
                        <td>Dagis deltid 3</td>
                        <td className="text-right">2 490 kr/mån</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Hundpensionat */}
                <div>
                  <h3 className="font-semibold text-blue-700 mb-2">
                    🏕️ Hundpensionat
                  </h3>
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-600 border-b">
                      <tr>
                        <th>Storlek</th>
                        <th className="text-right">Grundpris</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Liten hund (&lt;35cm)</td>
                        <td className="text-right">350 kr/natt</td>
                      </tr>
                      <tr>
                        <td>Medelstor hund (35-55cm)</td>
                        <td className="text-right">450 kr/natt</td>
                      </tr>
                      <tr>
                        <td>Stor hund (&gt;55cm)</td>
                        <td className="text-right">550 kr/natt</td>
                      </tr>
                      <tr className="text-xs text-gray-500">
                        <td colSpan={2}>
                          + säsongs-, helg- och helgdagstillägg
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Hundfrisör */}
                <div>
                  <h3 className="font-semibold text-purple-700 mb-2">
                    ✂️ Hundfrisör
                  </h3>
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-600 border-b">
                      <tr>
                        <th>Tjänst</th>
                        <th className="text-right">Pris</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Kloklippning</td>
                        <td className="text-right">150 kr</td>
                      </tr>
                      <tr>
                        <td>Bad stor hund</td>
                        <td className="text-right">250 kr</td>
                      </tr>
                      <tr>
                        <td>Bad liten hund</td>
                        <td className="text-right">180 kr</td>
                      </tr>
                      <tr>
                        <td>Trimning</td>
                        <td className="text-right">450-650 kr</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tillvalstjänster */}
                <div>
                  <h3 className="font-semibold text-amber-700 mb-2">
                    ⭐ Tillvalstjänster
                  </h3>
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-600 border-b">
                      <tr>
                        <th>Tjänst</th>
                        <th className="text-right">Pris</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Extra promenad</td>
                        <td className="text-right">75 kr</td>
                      </tr>
                      <tr>
                        <td>Medicinering</td>
                        <td className="text-right">50 kr/dag</td>
                      </tr>
                      <tr>
                        <td>Specialkost</td>
                        <td className="text-right">25 kr/dag</td>
                      </tr>
                      <tr>
                        <td>Upphämtning/lämning</td>
                        <td className="text-right">200 kr</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* 🧾 Flikar för olika verksamheter */}
        <Tabs defaultValue="dagis">
          <TabsList className="bg-gray-100 mb-3">
            <TabsTrigger value="dagis">🐾 Hunddagis</TabsTrigger>
            <TabsTrigger value="pensionat">🏕️ Hundpensionat</TabsTrigger>
            <TabsTrigger value="frisör">✂️ Hundfrisör</TabsTrigger>
          </TabsList>

          {["dagis", "pensionat", "frisör"].map((typ) => (
            <TabsContent key={typ} value={typ}>
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50 text-left border-b">
                      <tr>
                        {isColumnVisible("customer_number") && (
                          <th
                            className="p-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() =>
                              handleSort("owners" as keyof Invoice)
                            }
                          >
                            <div className="flex items-center gap-1">
                              Kundnr
                              {sortBy === "owners" && (
                                <span className="text-xs">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        )}
                        {isColumnVisible("customer_name") && (
                          <th
                            className="p-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() =>
                              handleSort("owners" as keyof Invoice)
                            }
                          >
                            <div className="flex items-center gap-1">
                              Kund
                              {sortBy === "owners" && (
                                <span className="text-xs">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        )}
                        {isColumnVisible("organization") && (
                          <th
                            className="p-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() =>
                              handleSort("organizations" as keyof Invoice)
                            }
                          >
                            <div className="flex items-center gap-1">
                              Organisation
                              {sortBy === "organizations" && (
                                <span className="text-xs">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        )}
                        {isColumnVisible("invoice_date") && (
                          <th
                            className="p-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("invoice_date")}
                          >
                            <div className="flex items-center gap-1">
                              Fakturadatum
                              {sortBy === "invoice_date" && (
                                <span className="text-xs">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        )}
                        {isColumnVisible("due_date") && (
                          <th
                            className="p-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("due_date")}
                          >
                            <div className="flex items-center gap-1">
                              Förfallodatum
                              {sortBy === "due_date" && (
                                <span className="text-xs">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        )}
                        {isColumnVisible("total_amount") && (
                          <th
                            className="p-2 text-right cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("total_amount")}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Totalt
                              {sortBy === "total_amount" && (
                                <span className="text-xs">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        )}
                        {isColumnVisible("status") && (
                          <th
                            className="p-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("status")}
                          >
                            <div className="flex items-center gap-1">
                              Status
                              {sortBy === "status" && (
                                <span className="text-xs">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        )}
                        {isColumnVisible("invoice_number") && (
                          <th
                            className="p-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("invoice_number")}
                          >
                            <div className="flex items-center gap-1">
                              Fakturanr
                              {sortBy === "invoice_number" && (
                                <span className="text-xs">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        )}
                        {isColumnVisible("actions") && (
                          <th className="p-2">Åtgärder</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.filter((inv) =>
                        inv.organizations?.name?.toLowerCase().includes(typ)
                      ).length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length}
                            className="text-center text-gray-400 p-3"
                          >
                            Inga fakturor hittades för {typ}.
                          </td>
                        </tr>
                      ) : (
                        filtered
                          .filter((inv) =>
                            inv.organizations?.name?.toLowerCase().includes(typ)
                          )
                          .map((inv) => {
                            // Färgkodning baserat på förfallodatum och status
                            const dueDate = new Date(inv.due_date);
                            const now = new Date();
                            const daysUntilDue = Math.ceil(
                              (dueDate.getTime() - now.getTime()) /
                                (1000 * 60 * 60 * 24)
                            );

                            let rowColorClass = "";
                            if (inv.status === "paid") {
                              rowColorClass =
                                "bg-emerald-50 hover:bg-emerald-100";
                            } else if (daysUntilDue < 0) {
                              rowColorClass = "bg-red-50 hover:bg-red-100"; // Förfallen
                            } else if (daysUntilDue <= 7) {
                              rowColorClass =
                                "bg-orange-50 hover:bg-orange-100"; // Förfaller snart
                            } else {
                              rowColorClass = "hover:bg-gray-50";
                            }

                            return (
                              <tr
                                key={inv.id}
                                className={`border-b ${rowColorClass}`}
                              >
                                {isColumnVisible("customer_number") && (
                                  <td className="p-2 font-mono">
                                    {inv.owners?.customer_number || "-"}
                                  </td>
                                )}
                                {isColumnVisible("customer_name") && (
                                  <td className="p-2">
                                    {inv.owners?.full_name || inv.billed_name}
                                  </td>
                                )}
                                {isColumnVisible("organization") && (
                                  <td className="p-2">
                                    {inv.organizations?.name || "-"}
                                  </td>
                                )}
                                {isColumnVisible("invoice_date") && (
                                  <td className="p-2">
                                    {new Date(
                                      inv.invoice_date
                                    ).toLocaleDateString("sv-SE")}
                                  </td>
                                )}
                                {isColumnVisible("due_date") && (
                                  <td className="p-2">
                                    {new Date(inv.due_date).toLocaleDateString(
                                      "sv-SE"
                                    )}
                                  </td>
                                )}
                                {isColumnVisible("total_amount") && (
                                  <td className="p-2 text-right">
                                    {inv.total_amount.toLocaleString("sv-SE")}{" "}
                                    kr
                                  </td>
                                )}
                                {isColumnVisible("status") && (
                                  <td className="p-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        inv.status === "draft"
                                          ? "bg-gray-100 text-gray-600"
                                          : inv.status === "sent"
                                            ? "bg-blue-100 text-blue-700"
                                            : inv.status === "paid"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {inv.status === "draft"
                                        ? "Utkast"
                                        : inv.status === "sent"
                                          ? "Skickad"
                                          : inv.status === "paid"
                                            ? "Betald"
                                            : "Makulerad"}
                                    </span>
                                  </td>
                                )}
                                {isColumnVisible("invoice_number") && (
                                  <td className="p-2 font-mono text-xs">
                                    {inv.invoice_number || "-"}
                                  </td>
                                )}
                                {isColumnVisible("actions") && (
                                  <td className="p-2">
                                    <button
                                      onClick={() => exportPDF(inv.id)}
                                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold text-sm flex items-center gap-1"
                                    >
                                      <FileText size={14} />
                                      PDF
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* 🧰 Felsökningspanel */}
        <Accordion type="single" collapsible className="mt-8">
          <AccordionItem value="debug">
            <AccordionTrigger className="text-sm text-gray-600">
              🧰 Visa felsökningslogg ({debugLogs.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-gray-900 text-gray-100 text-xs p-3 rounded-md max-h-64 overflow-y-auto">
                {debugLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`border-l-4 pl-2 mb-1 ${
                      log.type === "error"
                        ? "border-red-500 text-red-400"
                        : log.type === "success"
                          ? "border-emerald-500 text-emerald-400"
                          : "border-blue-500 text-blue-400"
                    }`}
                  >
                    <span className="text-gray-400">{log.time}</span>{" "}
                    {log.message}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* ➕ Modal för ny faktura */}
        {creating && (
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Skapa ny faktura</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <p className="text-sm text-gray-500">
                  Ange kund-ID och belopp för den nya fakturan.
                </p>
                <input
                  type="text"
                  placeholder="Kund-ID"
                  id="ownerId"
                  className="w-full border rounded p-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Belopp (SEK)"
                  id="amount"
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <DialogFooter className="flex justify-end gap-2">
                <button
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold text-sm"
                >
                  Avbryt
                </button>
                <button
                  onClick={async () => {
                    const ownerId = (
                      document.getElementById("ownerId") as HTMLInputElement
                    ).value;
                    const belopp = parseFloat(
                      (document.getElementById("amount") as HTMLInputElement)
                        .value
                    );
                    await createInvoice(ownerId, belopp);
                    // Modal stängs efter skapande
                  }}
                  className="px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm"
                >
                  Skapa
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
};
export default FakturorPage;
