"use client";
import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/app/context/AuthContext";
import {
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Download,
  Eye,
  ArrowLeft,
  TrendingUp,
  Receipt,
  Send,
  HelpCircle,
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number?: string | null;
  owner_id: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount?: number;
  status: "draft" | "sent" | "paid" | "overdue";
  notes?: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
  owner?: {
    full_name: string;
    customer_number?: number | null;
    phone?: string | null;
    email?: string | null;
  };
  invoice_items?: InvoiceItem[];
  created_at: string | null;
}

interface InvoiceItem {
  id: string;
  description: string | null;
  qty: number | null;
  unit_price: number | null;
  amount: number | null;
  booking_id?: string | null;
  invoice_id?: string;
  booking?: {
    id: string;
    dog_id?: string | null;
    dog?: {
      name: string;
      breed?: string | null;
    };
  };
}

export default function FakturaPage() {
  const supabase = createClient();
  const { currentOrgId } = useContext(AuthContext);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  const statusTypes = ["all", "draft", "sent", "paid", "overdue"];

  useEffect(() => {
    if (currentOrgId) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [currentPage, statusFilter, dateFilter, currentOrgId]);

  const fetchInvoices = async () => {
    if (!currentOrgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Steg 1: Hämta fakturor med ägare-info för denna organisation
      let query = supabase.from("invoices").select(
        `
          *,
          owner:owners!invoices_owner_id_fkey(
            full_name,
            customer_number,
            phone,
            email
          )
        `,
        { count: "exact" }
      );

      // **CRITICAL: Filter by org_id**
      query = query.eq("org_id", currentOrgId);

      // Applicera statusfilter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Applicera datumfilter
      if (dateFilter !== "all") {
        const now = new Date();
        const startDate = new Date();

        if (dateFilter === "this-month") {
          startDate.setDate(1);
        } else if (dateFilter === "last-month") {
          startDate.setMonth(now.getMonth() - 1);
          startDate.setDate(1);
        } else if (dateFilter === "this-year") {
          startDate.setMonth(0);
          startDate.setDate(1);
        }

        query = query.gte("invoice_date", startDate.toISOString());
      }

      // Paginering
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("invoice_date", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Steg 2: Hämta invoice_items för varje faktura (separat query)
      const invoiceIds = (data || []).map((inv) => inv.id);
      let invoicesWithItems: Invoice[] = (data || []).map((invoice: any) => ({
        ...invoice,
        status: invoice.status as "draft" | "sent" | "paid" | "overdue",
        invoice_items: [],
      }));

      if (invoiceIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("invoice_items")
          .select(
            "id, description, qty, unit_price, amount, booking_id, invoice_id"
          )
          .in("invoice_id", invoiceIds);

        if (itemsError) {
          console.warn("Varning: Kunde inte hämta invoice_items:", itemsError);
        } else {
          // Länka items till respektive faktura
          invoicesWithItems = invoicesWithItems.map((invoice) => ({
            ...invoice,
            invoice_items: (itemsData || []).filter(
              (item) => item.invoice_id === invoice.id
            ),
          }));
        }
      }

      setInvoices(invoicesWithItems);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Fel vid hämtning av fakturor:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice["status"]) => {
    try {
      const updates: any = { status };
      if (status === "paid") {
        updates.paid_at = new Date().toISOString();
        const invoice = invoices.find((inv) => inv.id === id);
        if (invoice && !invoice.paid_amount) {
          updates.paid_amount = invoice.total_amount;
        }
      }

      const { error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Optimistisk UI update istället för att refetcha
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) =>
          inv.id === id ? { ...inv, ...updates } : inv
        )
      );
    } catch (error) {
      console.error("Fel vid uppdatering av faktura:", error);
      // Vid fel, refetcha för att få korrekt state
      await fetchInvoices();
    }
  };

  const sendInvoiceEmail = async (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id);

    if (!invoice) {
      alert("❌ Faktura hittades inte");
      return;
    }

    if (!invoice.owner?.email) {
      alert(
        "❌ Ägaren har ingen registrerad email-adress. Lägg till email för att kunna skicka faktura."
      );
      return;
    }

    const confirmed = confirm(
      `Skicka faktura ${invoice.invoice_number} till ${invoice.owner.full_name} (${invoice.owner.email})?\n\n` +
        `Belopp: ${invoice.total_amount.toLocaleString("sv-SE")} kr\n` +
        `Förfallodatum: ${new Date(invoice.due_date).toLocaleDateString("sv-SE")}`
    );

    if (!confirmed) return;

    try {
      setSendingInvoice(id);

      const { data, error } = await supabase.functions.invoke(
        "send_invoice_email",
        { body: { invoice_id: id } }
      );

      if (error) {
        console.error("Error from Edge Function:", error);
        throw new Error(error.message || "Kunde inte skicka faktura");
      }

      alert(`✅ Faktura skickad till ${invoice.owner.email}!`);

      // Optimistisk UI update istället för att refetcha
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) =>
          inv.id === id
            ? {
                ...inv,
                status: "sent" as const,
                sent_at: new Date().toISOString(),
              }
            : inv
        )
      );
    } catch (error: any) {
      console.error("Fel vid skickning av faktura:", error);
      alert(`❌ Kunde inte skicka faktura: ${error.message}`);
    } finally {
      setSendingInvoice(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4" />;
      case "sent":
        return <Clock className="h-4 w-4" />;
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Utkast";
      case "sent":
        return "Skickad";
      case "paid":
        return "Betald";
      case "overdue":
        return "Förfallen";
      default:
        return "Okänd";
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      !searchTerm ||
      invoice.invoice_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.owner?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.owner?.customer_number?.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    // Datumfiltrering
    let matchesDate = true;
    if (dateFilter !== "all") {
      const invoiceDate = new Date(invoice.invoice_date);
      const now = new Date();

      if (dateFilter === "this-month") {
        matchesDate =
          invoiceDate.getMonth() === now.getMonth() &&
          invoiceDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === "last-month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        matchesDate =
          invoiceDate.getMonth() === lastMonth.getMonth() &&
          invoiceDate.getFullYear() === lastMonth.getFullYear();
      } else if (dateFilter === "this-year") {
        matchesDate = invoiceDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Ladda ner/Visa PDF
  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloadingPdf(invoiceId);
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.details || `HTTP ${response.status}`;
        throw new Error(`PDF-generering misslyckades: ${errorMessage}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("PDF-filen är tom");
      }

      const url = window.URL.createObjectURL(blob);

      // Öppna PDF i ny flik först (för att visa)
      window.open(url, "_blank");

      // Skapa också nedladdningslänk
      const a = document.createElement("a");
      a.href = url;
      a.download = `Faktura-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      alert(
        `❌ Kunde inte generera PDF:\n\n${error.message}\n\nKontrollera att fakturan har:\n- Organisationens betalningsinformation\n- Kundadress\n- Fakturarader`
      );
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Beräkna statistik
  const stats = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    paidAmount: invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.paid_amount || inv.total_amount), 0),
    unpaidAmount: invoices
      .filter((inv) => inv.status !== "paid")
      .reduce((sum, inv) => sum + inv.total_amount, 0),
    overdueCount: invoices.filter((inv) => inv.status === "overdue").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-[1600px] mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if org_id is missing
  if (!currentOrgId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Ingen organisation tilldelad
            </h2>
            <p className="text-red-800 mb-4">
              Du måste tilldelas en organisation för att se fakturor. Kontakta
              din administratör.
            </p>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Tillbaka till dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - enligt DESIGN_STANDARD_IMPLEMENTATION.md */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                  Ekonomi & Fakturor
                </h1>
                <Link
                  href="/ekonomi/hjalp"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-[#2c7a4c] hover:bg-gray-100 rounded-md transition-colors"
                  title="Hjälp: Så fungerar fakturering"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Hjälp</span>
                </Link>
              </div>
              <p className="mt-1 text-base text-gray-600">
                Översikt över fakturor, betalningar och ekonomisk status
              </p>
            </div>

            {/* Statistik inline höger */}
            <div className="flex items-center gap-4 ml-8">
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {stats.paidAmount.toLocaleString()} kr
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Betalda</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-orange-600">
                  {stats.unpaidAmount.toLocaleString()} kr
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Utestående</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-red-600">
                  {stats.overdueCount}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Förfallna</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - enligt DESIGN_STANDARD_IMPLEMENTATION.md */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#2c7a4c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2 rounded-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till Dashboard
          </Link>
          <div className="flex gap-3">
            <Link
              href="/faktura?new=true"
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny faktura
            </Link>
            <Link
              href="/faktura"
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              Alla fakturor
            </Link>
          </div>
        </div>

        {/* Sök och filter */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök på fakturanummer, kund eller kundnummer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2 text-base bg-white"
          >
            <option value="all">Alla status</option>
            <option value="draft">Utkast</option>
            <option value="sent">Skickade</option>
            <option value="paid">Betalda</option>
            <option value="overdue">Förfallna</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2 text-base bg-white"
          >
            <option value="all">Alla perioder</option>
            <option value="this-month">Denna månad</option>
            <option value="last-month">Förra månaden</option>
            <option value="this-year">Detta år</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setDateFilter("all");
            }}
            className="h-10 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
          >
            Rensa filter
          </button>
        </div>

        {/* Resultaträknare */}
        <div className="mb-2 text-sm text-gray-600">
          Visar <span className="font-semibold">{filteredInvoices.length}</span>{" "}
          av <span className="font-semibold">{invoices.length}</span> fakturor
        </div>

        {/* Fakturlista */}
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="hover:shadow-xl transition-all duration-300 border border-gray-200"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-[#2c7a4c]" />
                      Faktura #{invoice.invoice_number}
                    </CardTitle>
                    <p className="text-gray-900 font-medium text-sm">
                      {invoice.owner?.full_name || "Ingen kund angiven"}
                      {invoice.owner?.customer_number &&
                        ` (Kund #${invoice.owner.customer_number})`}
                    </p>
                    {/* Visa hundar från invoice_items */}
                    {invoice.invoice_items &&
                      invoice.invoice_items.some(
                        (item) => item.booking?.dog
                      ) && (
                        <p className="text-sm text-gray-600 mt-1">
                          🐕{" "}
                          {invoice.invoice_items
                            .filter((item) => item.booking?.dog)
                            .map((item) => item.booking!.dog!.name)
                            .filter(
                              (name, index, self) =>
                                self.indexOf(name) === index
                            ) // Remove duplicates
                            .join(", ")}
                        </p>
                      )}
                  </div>
                  <Badge className={getStatusColor(invoice.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(invoice.status)}
                      {getStatusText(invoice.status)}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                      Fakturadatum
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.invoice_date).toLocaleDateString(
                        "sv-SE"
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                      Förfallodag
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.due_date).toLocaleDateString("sv-SE")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                      Belopp
                    </h4>
                    <p className="text-sm font-bold text-[#2c7a4c]">
                      {invoice.total_amount.toLocaleString()} kr
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                      Betald
                    </h4>
                    <p className="text-sm text-gray-600">
                      {invoice.paid_amount
                        ? `${invoice.paid_amount.toLocaleString()} kr`
                        : "0 kr"}
                    </p>
                  </div>
                </div>

                {/* Fakturaradder */}
                {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Fakturaradder
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {invoice.invoice_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="flex-1">
                            {item.description}
                            {item.booking?.dog && (
                              <span className="text-gray-500 ml-2">
                                ({item.booking.dog.name})
                              </span>
                            )}
                          </span>
                          <span className="text-right whitespace-nowrap">
                            {item.qty} × {item.unit_price} kr ={" "}
                            {item.amount?.toLocaleString()} kr
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {invoice.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Anteckningar
                    </h4>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}

                {/* Kontaktinfo */}
                {(invoice.owner?.phone || invoice.owner?.email) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Kontaktuppgifter
                    </h4>
                    <div className="flex gap-4 text-sm text-gray-600">
                      {invoice.owner.phone && (
                        <a
                          href={`tel:${invoice.owner.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {invoice.owner.phone}
                        </a>
                      )}
                      {invoice.owner.email && (
                        <a
                          href={`mailto:${invoice.owner.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {invoice.owner.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Åtgärder */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadPdf(
                        invoice.id,
                        invoice.invoice_number || `faktura-${invoice.id}`
                      )
                    }
                    disabled={downloadingPdf === invoice.id}
                    className="border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
                  >
                    {downloadingPdf === invoice.id ? (
                      <>
                        <Download className="h-4 w-4 mr-2 animate-spin" />
                        Genererar PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Visa/Ladda ner PDF
                      </>
                    )}
                  </Button>

                  {invoice.status === "draft" && (
                    <Button
                      onClick={() => sendInvoiceEmail(invoice.id)}
                      disabled={sendingInvoice === invoice.id}
                      className="bg-[#2c7a4c] hover:bg-[#236139] text-white focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendingInvoice === invoice.id
                        ? "Skickar email..."
                        : "Skicka via email"}
                    </Button>
                  )}

                  {invoice.status === "sent" && (
                    <Button
                      onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                      className="bg-[#2c7a4c] hover:bg-[#236139] text-white focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Markera som betald
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tom lista */}
        {filteredInvoices.length === 0 && (
          <Card className="text-center py-16 border-2 border-dashed border-gray-300">
            <CardContent>
              <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Inga fakturor hittades
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== "all"
                  ? "Prova att ändra dina sökkriterier för att hitta fakturor."
                  : "Skapa din första faktura för att komma igång med faktureringen."}
              </p>
              <Link href="/faktura/new">
                <Button className="bg-[#2c7a4c] hover:bg-[#236139] text-white focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa första fakturan
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Paginering */}
        {filteredInvoices.length > 0 && totalCount > itemsPerPage && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Visar {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, totalCount)} av{" "}
                  {totalCount} fakturor
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Föregående
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.ceil(totalCount / itemsPerPage) },
                      (_, i) => i + 1
                    )
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === Math.ceil(totalCount / itemsPerPage) ||
                          Math.abs(page - currentPage) <= 2
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={
                              currentPage === page
                                ? "bg-[#2c7a4c] hover:bg-[#236139]"
                                : ""
                            }
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(Math.ceil(totalCount / itemsPerPage), p + 1)
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(totalCount / itemsPerPage)
                    }
                  >
                    Nästa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
