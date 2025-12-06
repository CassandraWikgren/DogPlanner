"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

type Owner = {
  id: string;
  full_name: string | null;
  customer_number: number | null;
  phone: string | null;
  email: string | null;
};

type Org = {
  id: string;
  name: string | null;
  org_number: string | null;
  email: string | null;
  phone: string | null;
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
  owners?: Owner;
  orgs?: Org;
};

type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string | null;
  qty: number | null;
  unit_price: number | null;
  amount: number | null;
};

const FakturorPage = () => {
  // 🧠 Statehantering
  const { currentOrgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [locked, setLocked] = useState(false);
  const [creating, setCreating] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [totals, setTotals] = useState({ total: 0, paid: 0, unpaid: 0 });
  const [online, setOnline] = useState(true);

  // 🪵 Felsökningslogg – sparar i localStorage
  function logDebug(
    type: "info" | "success" | "error",
    message: string,
    details?: any
  ) {
    console.log(`[Fakturor] ${message}`, details || "");
    const newLog = { time: new Date().toISOString(), type, message, details };
    const existing = JSON.parse(localStorage.getItem("debugLogs") || "[]");
    const updated = [newLog, ...existing].slice(0, 100);
    localStorage.setItem("debugLogs", JSON.stringify(updated));
    setDebugLogs(updated);
  }

  // 📦 Hämta fakturor (inkl. kund + org)
  async function loadInvoices() {
    try {
      setLoading(true);
      logDebug("info", "Hämtar fakturor…");

      const supabase = createClient();
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          id, org_id, owner_id, invoice_date, due_date, total_amount, status,
          billed_name, billed_email, billed_address,
          owners(id, full_name, customer_number, phone, email),
          orgs(id, name, org_number, email, phone)
        `
        )
        .order("invoice_date", { ascending: false });

      if (error) throw error;

      // Process the data to handle the array relations
      const processedData =
        data?.map((invoice: any) => ({
          ...invoice,
          owners: Array.isArray(invoice.owners)
            ? invoice.owners[0]
            : invoice.owners,
          orgs: Array.isArray(invoice.orgs) ? invoice.orgs[0] : invoice.orgs,
        })) || [];

      setInvoices(processedData);
      setFiltered(processedData);
      logDebug("success", `Fakturor laddade: ${processedData.length} st`);
      calcTotals(processedData);
    } catch (err: any) {
      toast(`Fel vid hämtning: ${err.message}`, "error");
      logDebug("error", "Fel vid hämtning av fakturor", err);
    } finally {
      setLoading(false);
    }
  }

  // 🧾 Hämta fakturarader (invoice_items)
  async function loadItems() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("invoice_items")
        .select("id, invoice_id, description, qty, unit_price, amount");
      if (error) throw error;
      setItems(data || []);
      logDebug("success", `Fakturarader laddade: ${data?.length || 0} st`);
    } catch (err: any) {
      logDebug("error", "Fel vid hämtning av fakturarader", err);
    }
  }

  // 💰 Beräkna totalsummor
  function calcTotals(data: Invoice[]) {
    const total = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paid = data
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const unpaid = total - paid;
    setTotals({ total, paid, unpaid });
  }

  // 🔍 Filtrering vid sökning
  useEffect(() => {
    if (!search) {
      setFiltered(invoices);
      return;
    }
    const s = search.toLowerCase();
    const filteredData = invoices.filter(
      (inv) =>
        inv.billed_name?.toLowerCase().includes(s) ||
        inv.owners?.full_name?.toLowerCase().includes(s) ||
        (inv.owners?.customer_number &&
          inv.owners.customer_number.toString().includes(s)) ||
        inv.billed_email?.toLowerCase().includes(s)
    );
    setFiltered(filteredData);
  }, [search, invoices]);

  // 🧭 Initiering – ladda data och starta realtidslyssning
  useEffect(() => {
    loadInvoices();
    loadItems();
    const supabase = createClient();
    const channel = supabase
      .channel("invoice_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        loadInvoices
      )
      .subscribe();
    logDebug("info", "Realtidslyssning aktiv för fakturor");
    return () => {
      supabase.removeChannel(channel);
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
      toast(message);
      logDebug("info", newLocked ? "Månad låst" : "Månad upplåst");
    } catch (err: any) {
      logDebug("error", "Fel vid låsning", err);
    }
  }

  // ➕ Skapa ny faktura (manuell)
  async function createInvoice(ownerId: string, belopp: number) {
    try {
      setCreating(true);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      if (!currentOrgId) {
        toast("Ingen organisation tilldelad", "error");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.from("invoices").insert({
        org_id: currentOrgId,
        owner_id: ownerId,
        invoice_date: new Date().toISOString(),
        due_date: dueDate.toISOString(),
        total_amount: belopp,
        status: "draft",
      });
      if (error) throw error;
      toast("Faktura skapad", "success");
      loadInvoices();
    } catch (err: any) {
      logDebug("error", "Fel vid skapande av faktura", err);
    } finally {
      setCreating(false);
    }
  }

  // 🧾 Generera PDF (anropar Edge Function)
  async function exportPDF(invoiceId: string) {
    try {
      toast("Genererar PDF…");
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("pdf", {
        body: { invoiceId },
      });
      if (error) throw error;
      toast("PDF genererad");
      logDebug("success", "PDF skapad för faktura", invoiceId);
      loadInvoices();
    } catch (err: any) {
      toast(`Fel vid PDF-export: ${err.message}`, "error");
      logDebug("error", "Fel vid PDF-export", err);
    }
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="animate-spin" /> Laddar fakturor…
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-2">
              {invoices.length} fakturor laddade. Totalt{" "}
              {totals.total.toLocaleString()} kr.
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h1 className="page-title">
                💸 DogPlanner – Fakturor och underlag
              </h1>
              <p className="page-subtitle">
                Hantera fakturor för hunddagis, pensionat och frisör.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  online
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {online ? "🟢 Online med Supabase" : "🔴 Ej uppkopplad"}
              </span>
              <Button
                variant="outline"
                onClick={toggleLock}
                className="flex items-center gap-1"
              >
                {locked ? <Unlock size={16} /> : <Lock size={16} />}
                {locked ? "Avlås månad" : "Lås månad"}
              </Button>
              <Button
                onClick={() => setCreating(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                disabled={locked}
              >
                <PlusCircle size={16} /> Ny faktura
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="page-main">
        {/* 💰 Summeringsrutor */}
        <div className="grid sm:grid-cols-3 gap-4 text-center mb-6">
          <div className="stats-box">
            <p className="stats-label">💰 Totalt</p>
            <p className="stats-number">
              {totals.total.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div className="stats-box">
            <p className="stats-label">✅ Betalt</p>
            <p className="stats-number text-emerald-700">
              {totals.paid.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div className="stats-box">
            <p className="stats-label">🕓 Ej betalt</p>
            <p className="stats-number text-red-600">
              {totals.unpaid.toLocaleString("sv-SE")} kr
            </p>
          </div>
        </div>

        {/* 🔍 Sökfält */}
        <div className="flex items-center gap-2 mb-6">
          <Input
            placeholder="Sök kund eller faktura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field max-w-sm"
          />
          {search && (
            <Button variant="outline" onClick={() => setSearch("")}>
              Rensa
            </Button>
          )}
        </div>

        {/* 💵 Prisöversikt (accordion) */}
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-emerald-700 font-medium">
              💰 Visa prisöversikt
            </AccordionTrigger>
            <AccordionContent className="bg-white border rounded-md shadow-sm p-4">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-600 border-b">
                  <tr>
                    <th>Tjänst</th>
                    <th>Pris</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dagis heltid</td>
                    <td>3 990 kr/mån</td>
                  </tr>
                  <tr>
                    <td>Dagis deltid 2</td>
                    <td>2 990 kr/mån</td>
                  </tr>
                  <tr>
                    <td>Dagis deltid 3</td>
                    <td>2 490 kr/mån</td>
                  </tr>
                  <tr>
                    <td>Pensionat liten</td>
                    <td>350 kr/natt</td>
                  </tr>
                  <tr>
                    <td>Pensionat mellan</td>
                    <td>450 kr/natt</td>
                  </tr>
                  <tr>
                    <td>Pensionat stor</td>
                    <td>550 kr/natt</td>
                  </tr>
                  <tr>
                    <td>Kloklippning</td>
                    <td>150 kr</td>
                  </tr>
                  <tr>
                    <td>Bad stor hund</td>
                    <td>250 kr</td>
                  </tr>
                </tbody>
              </table>
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
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left border-b">
                    <tr>
                      <th className="p-2">Kundnr</th>
                      <th className="p-2">Kund</th>
                      <th className="p-2">Fakturadatum</th>
                      <th className="p-2">Förfallodatum</th>
                      <th className="p-2 text-right">Totalt</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Faktura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.filter((inv) =>
                      inv.orgs?.name?.toLowerCase().includes(typ)
                    ).length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center text-gray-400 p-3"
                        >
                          Inga fakturor hittades.
                        </td>
                      </tr>
                    ) : (
                      filtered
                        .filter((inv) =>
                          inv.orgs?.name?.toLowerCase().includes(typ)
                        )
                        .map((inv) => (
                          <tr
                            key={inv.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-2 font-mono">
                              {inv.owners?.customer_number || "-"}
                            </td>
                            <td className="p-2">
                              {inv.owners?.full_name || inv.billed_name}
                            </td>
                            <td className="p-2">
                              {new Date(inv.invoice_date).toLocaleDateString(
                                "sv-SE"
                              )}
                            </td>
                            <td className="p-2">
                              {new Date(inv.due_date).toLocaleDateString(
                                "sv-SE"
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {inv.total_amount.toLocaleString("sv-SE")} kr
                            </td>
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
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportPDF(inv.id)}
                                className="flex items-center gap-1"
                              >
                                <FileText size={14} />
                                Generera PDF
                              </Button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
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
                <Button variant="outline" onClick={() => setCreating(false)}>
                  Avbryt
                </Button>
                <Button
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Skapa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
};

export default FakturorPage;
