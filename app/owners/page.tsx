"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Plus,
  Download,
  Mail,
  Phone,
  PawPrint,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Filter,
  SortAsc,
  SortDesc,
  FileText,
  User,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

interface Owner {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  customer_number?: string;
  notes?: string;
  created_at: string;
  org_id: string;
  dogs?: Dog[];
}

interface Dog {
  id: string;
  name: string;
  breed?: string;
  subscription?: string;
  owner_id: string;
}

type SortKey = keyof Owner | "dog_count";
type SortDirection = "asc" | "desc";

export default function OwnersPage() {
  const { user, currentOrgId, loading: authLoading } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sök och filter states
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

  // Form data för ny/redigera ägare
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Ladda ägare från Supabase
  useEffect(() => {
    if (!currentOrgId || authLoading) return;
    loadOwners();
  }, [currentOrgId, authLoading]);

  const loadOwners = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from("owners")
        .select(
          `
          *,
          dogs!dogs_owner_id_fkey (
            id,
            name,
            breed,
            subscription
          )
        `
        )
        .eq("org_id", currentOrgId)
        .order("full_name", { ascending: true });

      if (fetchError) {
        console.error(
          `${ERROR_CODES.DATABASE_CONNECTION} Fel vid hämtning av ägare:`,
          fetchError
        );
        setError(
          `${ERROR_CODES.DATABASE_CONNECTION} Kunde inte ladda ägare: ${fetchError.message}`
        );
        return;
      }

      setOwners(data || []);
    } catch (err) {
      console.error(`${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel:`, err);
      setError(`${ERROR_CODES.DATABASE_CONNECTION} Ett oväntat fel inträffade`);
    } finally {
      setLoading(false);
    }
  };

  // Filtrerade och sorterade ägare
  const filteredAndSortedOwners = useMemo(() => {
    let filtered = owners.filter((owner) => {
      const searchTerm = search.toLowerCase();
      return (
        owner.full_name?.toLowerCase().includes(searchTerm) ||
        owner.email?.toLowerCase().includes(searchTerm) ||
        owner.phone?.includes(searchTerm) ||
        owner.dogs?.some((dog) => dog.name.toLowerCase().includes(searchTerm))
      );
    });

    // Aktiva filter (om vi har hundar)
    if (showActiveOnly) {
      filtered = filtered.filter(
        (owner) => owner.dogs && owner.dogs.length > 0
      );
    }

    // Sortering
    filtered.sort((a, b) => {
      let aValue: any = a[sortKey as keyof Owner];
      let bValue: any = b[sortKey as keyof Owner];

      if (sortKey === "dog_count") {
        aValue = a.dogs?.length || 0;
        bValue = b.dogs?.length || 0;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === "string") {
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [owners, search, showActiveOnly, sortKey, sortDirection]);

  // Hantera sortering
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // PDF Export
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Ägare - DogPlanner", 14, 20);

      const tableData = filteredAndSortedOwners.map((owner) => [
        owner.full_name,
        owner.email || "-",
        owner.phone || "-",
        owner.dogs?.length.toString() || "0",
        owner.dogs?.map((d) => d.name).join(", ") || "-",
      ]);

      autoTable(doc, {
        head: [["Namn", "E-post", "Telefon", "Antal hundar", "Hundnamn"]],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [44, 122, 76] },
      });

      doc.save(`agare-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error(`${ERROR_CODES.PDF_EXPORT} Fel vid PDF-export:`, err);
      setError(`${ERROR_CODES.PDF_EXPORT} Kunde inte skapa PDF`);
    }
  };

  // Spara ny/uppdaterad ägare
  const saveOwner = async () => {
    if (!currentOrgId) {
      setError(`${ERROR_CODES.VALIDATION} Organisation saknas`);
      return;
    }

    try {
      if (!formData.full_name.trim()) {
        setError(`${ERROR_CODES.VALIDATION} Namn är obligatoriskt`);
        return;
      }

      const ownerData = {
        ...formData,
        org_id: currentOrgId,
      };

      if (editingOwner) {
        // Uppdatera befintlig ägare
        const { error: updateError } = await (supabase as any)
          .from("owners")
          .update(ownerData)
          .eq("id", editingOwner.id);

        if (updateError) {
          console.error(
            `${ERROR_CODES.DATABASE_CONNECTION} Fel vid uppdatering:`,
            updateError
          );
          setError(
            `${ERROR_CODES.DATABASE_CONNECTION} Kunde inte uppdatera ägare: ${updateError.message}`
          );
          return;
        }
      } else {
        // Skapa ny ägare
        const { error: insertError } = await (supabase as any)
          .from("owners")
          .insert([ownerData]);

        if (insertError) {
          console.error(
            `${ERROR_CODES.DATABASE_CONNECTION} Fel vid skapande:`,
            insertError
          );
          setError(
            `${ERROR_CODES.DATABASE_CONNECTION} Kunde inte skapa ägare: ${insertError.message}`
          );
          return;
        }
      }

      // Återställ form och stäng modal
      resetForm();
      setShowAddModal(false);
      setEditingOwner(null);

      // Ladda om data
      await loadOwners();
    } catch (err) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel vid sparande:`,
        err
      );
      setError(
        `${ERROR_CODES.DATABASE_CONNECTION} Ett oväntat fel inträffade vid sparande`
      );
    }
  };

  // Ta bort ägare
  const deleteOwner = async (owner: Owner) => {
    if (
      !confirm(
        `Är du säker på att du vill ta bort ${owner.full_name}? Detta kommer också att påverka hundarnas ägare-koppling.`
      )
    ) {
      return;
    }

    try {
      const { error: deleteError } = await (supabase as any)
        .from("owners")
        .delete()
        .eq("id", owner.id);

      if (deleteError) {
        console.error(
          `${ERROR_CODES.DATABASE_CONNECTION} Fel vid borttagning:`,
          deleteError
        );
        setError(
          `${ERROR_CODES.DATABASE_CONNECTION} Kunde inte ta bort ägare: ${deleteError.message}`
        );
        return;
      }

      await loadOwners();
    } catch (err) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel vid borttagning:`,
        err
      );
      setError(
        `${ERROR_CODES.DATABASE_CONNECTION} Ett oväntat fel inträffade vid borttagning`
      );
    }
  };

  // Återställ formulär
  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
    setError(null);
  };

  // Öppna redigering
  const startEditing = (owner: Owner) => {
    setEditingOwner(owner);
    setFormData({
      full_name: owner.full_name || "",
      email: owner.email || "",
      phone: owner.phone || "",
      address: owner.address || "",
      notes: owner.notes || "",
    });
    setShowAddModal(true);
  };

  const PRIMARY_GREEN = "#2c7a4c";

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-[1600px] mx-auto px-8 sm:px-12 lg:px-16">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Laddar ägare...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1600px] mx-auto px-8 sm:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                Ägare
              </h1>
              <p className="text-gray-600 mt-2">
                Hantera alla hundägare och deras kontaktinformation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={exportToPDF}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                PDF-export
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Ny ägare
              </Button>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Totalt</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {owners.length}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Med hundar</p>
                    <p className="text-2xl font-bold text-green-600">
                      {owners.filter((o) => o.dogs && o.dogs.length > 0).length}
                    </p>
                  </div>
                  <PawPrint className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Totalt hundar</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {owners.reduce(
                        (sum, o) => sum + (o.dogs?.length || 0),
                        0
                      )}
                    </p>
                  </div>
                  <PawPrint className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Visas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {filteredAndSortedOwners.length}
                    </p>
                  </div>
                  <Filter className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sök och filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Sök på namn, e-post, telefon eller hundnamn..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={showActiveOnly ? "default" : "outline"}
                  onClick={() => setShowActiveOnly(!showActiveOnly)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showActiveOnly ? "Endast med hundar" : "Visa alla"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ägartabell */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Alla ägare ({filteredAndSortedOwners.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("full_name")}
                    >
                      <div className="flex items-center gap-2">
                        Namn
                        {sortKey === "full_name" &&
                          (sortDirection === "asc" ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Kontakt
                    </th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("dog_count")}
                    >
                      <div className="flex items-center gap-2">
                        Hundar
                        {sortKey === "dog_count" &&
                          (sortDirection === "asc" ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedOwners.map((owner) => (
                    <tr key={owner.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {owner.full_name}
                          </p>
                          {owner.address && (
                            <p className="text-sm text-gray-500">
                              {owner.address}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {owner.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <a
                                href={`mailto:${owner.email}`}
                                className="text-blue-600 hover:underline"
                              >
                                {owner.email}
                              </a>
                            </div>
                          )}
                          {owner.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <a
                                href={`tel:${owner.phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {owner.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit">
                            {owner.dogs?.length || 0} hundar
                          </Badge>
                          {owner.dogs && owner.dogs.length > 0 && (
                            <div className="text-xs text-gray-600">
                              {owner.dogs.map((dog) => dog.name).join(", ")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(owner)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Link href={`/owners/${owner.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOwner(owner)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAndSortedOwners.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {search
                      ? "Inga ägare matchar sökningen"
                      : "Inga ägare registrerade än"}
                  </p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till första ägaren
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{editingOwner ? "Redigera ägare" : "Ny ägare"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingOwner(null);
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fullständigt namn *
                  </label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    placeholder="Anna Andersson"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-postadress
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="anna@exempel.se"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefonnummer
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="070-123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adress
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Storgatan 123, 123 45 Stockholm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anteckningar
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Särskilda önskemål eller anteckningar..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingOwner(null);
                      resetForm();
                    }}
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={saveOwner}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {editingOwner ? "Uppdatera" : "Skapa"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
