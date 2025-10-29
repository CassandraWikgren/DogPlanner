"use client";
import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
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
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-600" />
              Fakturor
            </h1>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Ny faktura
            </Button>
          </div>
          <p className="text-gray-600">
            Hantera alla fakturor och betalningar för din verksamhet.
          </p>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Totala intäkter
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.paidAmount.toLocaleString()} kr
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Utestående
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.unpaidAmount.toLocaleString()} kr
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Förfallna</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.overdueCount}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Antal fakturor
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalInvoices}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
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
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Faktura #{invoice.invoice_number}
                    </CardTitle>
                    <p className="text-gray-600">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Fakturadatum
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.invoice_date).toLocaleDateString(
                        "sv-SE"
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Förfallodag
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.due_date).toLocaleDateString("sv-SE")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Belopp</h4>
                    <p className="text-sm text-gray-600">
                      {invoice.total_amount.toLocaleString()} kr
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Betald</h4>
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
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Visa
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Ladda ner
                  </Button>
                  {invoice.status === "sent" && (
                    <Button
                      onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Markera som betald
                    </Button>
                  )}
                  {invoice.status === "draft" && (
                    <Button
                      onClick={() => updateInvoiceStatus(invoice.id, "sent")}
                      className="bg-blue-600 hover:bg-blue-700"
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
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga fakturor hittades
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Prova att ändra dina sökkriterier."
                  : "Skapa din första faktura för att komma igång."}
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Skapa första fakturan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
