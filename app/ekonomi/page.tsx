"use client";
import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  owner_id: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount?: number;
  status: "draft" | "sent" | "paid" | "overdue";
  notes?: string;
  owner?: {
    full_name: string;
    customer_number?: number;
    phone?: string;
    email?: string;
  };
  invoice_lines?: InvoiceLine[];
  created_at: string;
}

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function FakturaPage() {
  const supabase = createClientComponentClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusTypes = ["all", "draft", "sent", "paid", "overdue"];

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          owner:owners!invoices_owner_id_fkey(
            full_name,
            customer_number,
            phone,
            email
          ),
          invoice_lines(
            id,
            description,
            quantity,
            unit_price,
            total_price
          )
        `
        )
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
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
        updates.paid_date = new Date().toISOString();
        // Om det inte finns paid_amount, sätt det till total_amount
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
      await fetchInvoices();
    } catch (error) {
      console.error("Fel vid uppdatering av faktura:", error);
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

    return matchesSearch && matchesStatus;
  });

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
        <div className="max-w-7xl mx-auto px-6 py-12">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Hero Section */}
      <section
        className="relative text-center text-white overflow-hidden"
        style={{
          padding: "80px 20px 110px",
          background:
            'linear-gradient(rgba(44, 122, 76, 0.88), rgba(44, 122, 76, 0.88)), url("/Hero.jpeg") center/cover no-repeat',
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Ekonomi & Fakturor</h1>
          <p className="text-xl mb-8 leading-relaxed opacity-95 max-w-2xl mx-auto">
            Översikt över fakturor, betalningar och ekonomisk status.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 -mt-12 pb-16 relative z-20">
        {/* Floating Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl font-bold text-green-600">
                {stats.paidAmount.toLocaleString()} kr
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-sm text-gray-600">Betalda fakturor</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl font-bold text-orange-600">
                {stats.unpaidAmount.toLocaleString()} kr
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-sm text-gray-600">Utestående</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-red-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl font-bold text-red-600">
                {stats.overdueCount}
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-sm text-gray-600">Förfallna fakturor</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl font-bold text-[#2c7a4c]">
                {stats.totalInvoices}
              </div>
              <Receipt className="h-8 w-8 text-[#2c7a4c]" />
            </div>
            <div className="text-sm text-gray-600">Totalt antal fakturor</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#2c7a4c] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till Dashboard
          </Link>
          <div className="flex gap-3">
            <Link href="/faktura/new">
              <Button className="bg-[#2c7a4c] hover:bg-[#236139] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Ny faktura
              </Button>
            </Link>
            <Link href="/faktura">
              <Button
                variant="outline"
                className="border-[#2c7a4c] text-[#2c7a4c] hover:bg-green-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Alla fakturor
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter */}
        <Card className="mb-8 border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-[#2c7a4c]" />
              Sök och filtrera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök på fakturanummer, kund eller kundnummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#2c7a4c] focus:ring-[#2c7a4c]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
              >
                <option value="all">Alla status</option>
                <option value="draft">Utkast</option>
                <option value="sent">Skickade</option>
                <option value="paid">Betalda</option>
                <option value="overdue">Förfallna</option>
              </select>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Rensa filter
              </Button>
            </div>
          </CardContent>
        </Card>

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
                    <p className="text-gray-600 text-sm">
                      {invoice.owner?.full_name}
                      {invoice.owner?.customer_number &&
                        ` (Kund #${invoice.owner.customer_number})`}
                    </p>
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
                {invoice.invoice_lines && invoice.invoice_lines.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Fakturaradder
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {invoice.invoice_lines.map((line) => (
                        <div
                          key={line.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>{line.description}</span>
                          <span>
                            {line.quantity} × {line.unit_price} kr ={" "}
                            {line.total_price.toLocaleString()} kr
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
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ladda ner PDF
                  </Button>
                  {invoice.status === "sent" && (
                    <Button
                      onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Markera som betald
                    </Button>
                  )}
                  {invoice.status === "draft" && (
                    <Button
                      onClick={() => updateInvoiceStatus(invoice.id, "sent")}
                      className="bg-[#2c7a4c] hover:bg-[#236139] text-white"
                      size="sm"
                    >
                      Skicka faktura
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
                <Button className="bg-[#2c7a4c] hover:bg-[#236139] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa första fakturan
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
