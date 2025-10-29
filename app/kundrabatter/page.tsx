"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Percent, User, Calendar, Trash2, Edit, Plus } from "lucide-react";

interface Owner {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
}

interface CustomerDiscount {
  id: string;
  owner_id: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  description: string;
  is_permanent: boolean;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  owners?: Owner;
}

export default function CustomerDiscountsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { user } = useAuth();

  const [discounts, setDiscounts] = useState<CustomerDiscount[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Form state
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingDiscount, setEditingDiscount] =
    useState<CustomerDiscount | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [isPermanent, setIsPermanent] = useState<boolean>(true);
  const [validFrom, setValidFrom] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load discounts with owner information
      const { data: discountsData } = await supabase
        .from("customer_discounts")
        .select(
          `
          *,
          owners (
            id,
            full_name,
            phone,
            email
          )
        `
        )
        .order("created_at", { ascending: false });

      // Load all owners
      const { data: ownersData } = await supabase
        .from("owners")
        .select("id, full_name, phone, email")
        .order("full_name");

      setDiscounts(discountsData || []);
      setOwners(ownersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage("❌ Fel vid laddning av data");
    }
  };

  const resetForm = () => {
    setSelectedOwner("");
    setDiscountType("percentage");
    setDiscountValue(0);
    setDescription("");
    setIsPermanent(true);
    setValidFrom("");
    setValidUntil("");
    setEditingDiscount(null);
    setShowForm(false);
  };

  const handleEdit = (discount: CustomerDiscount) => {
    setEditingDiscount(discount);
    setSelectedOwner(discount.owner_id);
    setDiscountType(discount.discount_type);
    setDiscountValue(discount.discount_value);
    setDescription(discount.description);
    setIsPermanent(discount.is_permanent);
    setValidFrom(discount.valid_from || "");
    setValidUntil(discount.valid_until || "");
    setShowForm(true);
  };

  const validateForm = (): string | null => {
    if (!selectedOwner) return "Välj en kund";
    if (!description.trim()) return "Ange beskrivning";
    if (discountValue <= 0) return "Rabattvärde måste vara större än 0";
    if (discountType === "percentage" && discountValue > 100)
      return "Procentrabatt kan inte vara över 100%";
    if (!isPermanent) {
      if (!validFrom) return "Ange giltighetsdatum från";
      if (!validUntil) return "Ange giltighetsdatum till";
      if (new Date(validFrom) >= new Date(validUntil))
        return "Till-datum måste vara efter från-datum";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage(`❌ ${validationError}`);
      return;
    }

    setLoading(true);
    try {
      const discountData = {
        owner_id: selectedOwner,
        discount_type: discountType,
        discount_value: discountValue,
        description,
        is_permanent: isPermanent,
        valid_from: isPermanent ? null : validFrom,
        valid_until: isPermanent ? null : validUntil,
        is_active: true,
      };

      if (editingDiscount) {
        // Update existing discount
        const { error } = await supabase
          .from("customer_discounts")
          .update(discountData)
          .eq("id", editingDiscount.id);

        if (error) throw error;
        setMessage("✅ Rabatt uppdaterad!");
      } else {
        // Create new discount
        const { error } = await supabase
          .from("customer_discounts")
          .insert([discountData]);

        if (error) throw error;
        setMessage("✅ Rabatt skapad!");
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error("Error saving discount:", error);
      setMessage("❌ Fel vid sparande");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (discount: CustomerDiscount) => {
    if (
      !confirm(
        `Är du säker på att du vill ta bort rabatten "${discount.description}" för ${discount.owners?.full_name}?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("customer_discounts")
        .delete()
        .eq("id", discount.id);

      if (error) throw error;

      setMessage("✅ Rabatt borttagen!");
      await loadData();
    } catch (error) {
      console.error("Error deleting discount:", error);
      setMessage("❌ Fel vid borttagning");
    }
  };

  const toggleActive = async (discount: CustomerDiscount) => {
    try {
      const { error } = await supabase
        .from("customer_discounts")
        .update({ is_active: !discount.is_active })
        .eq("id", discount.id);

      if (error) throw error;

      setMessage(
        `✅ Rabatt ${discount.is_active ? "inaktiverad" : "aktiverad"}!`
      );
      await loadData();
    } catch (error) {
      console.error("Error toggling discount:", error);
      setMessage("❌ Fel vid ändring av status");
    }
  };

  const formatDiscountValue = (discount: CustomerDiscount): string => {
    return discount.discount_type === "percentage"
      ? `${discount.discount_value}%`
      : `${discount.discount_value} kr`;
  };

  const getValidityText = (discount: CustomerDiscount): string => {
    if (discount.is_permanent) return "Permanent";
    const from = new Date(discount.valid_from!).toLocaleDateString("sv-SE");
    const until = new Date(discount.valid_until!).toLocaleDateString("sv-SE");
    return `${from} - ${until}`;
  };

  const isDiscountValid = (discount: CustomerDiscount): boolean => {
    if (!discount.is_active) return false;
    if (discount.is_permanent) return true;

    const now = new Date();
    const from = new Date(discount.valid_from!);
    const until = new Date(discount.valid_until!);

    return now >= from && now <= until;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">
            💰 Kundrabatter
          </h1>
          <p className="text-gray-600">
            Hantera permanenta och tillfälliga rabatter för kunder
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.startsWith("✅")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rabattlista */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Aktiva rabatter
                  </CardTitle>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ny rabatt
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {discounts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Inga rabatter registrerade
                  </p>
                ) : (
                  <div className="space-y-4">
                    {discounts.map((discount) => (
                      <div
                        key={discount.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          isDiscountValid(discount)
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-gray-900">
                                {discount.owners?.full_name}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isDiscountValid(discount)
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {isDiscountValid(discount)
                                  ? "Aktiv"
                                  : "Inaktiv"}
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                -{formatDiscountValue(discount)}
                              </span>
                            </div>

                            <p className="text-gray-700 mb-2">
                              {discount.description}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {getValidityText(discount)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {discount.owners?.phone ||
                                  discount.owners?.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(discount)}
                            >
                              {discount.is_active ? "Inaktivera" : "Aktivera"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(discount)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(discount)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulär */}
          {showForm && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingDiscount ? "Redigera rabatt" : "Ny kundrabatt"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Kund
                    </label>
                    <select
                      value={selectedOwner}
                      onChange={(e) => setSelectedOwner(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      disabled={!!editingDiscount}
                    >
                      <option value="">-- Välj kund --</option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Typ
                      </label>
                      <select
                        value={discountType}
                        onChange={(e) =>
                          setDiscountType(
                            e.target.value as "percentage" | "fixed_amount"
                          )
                        }
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="percentage">Procent (%)</option>
                        <option value="fixed_amount">Fast belopp (kr)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Värde
                      </label>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) =>
                          setDiscountValue(Number(e.target.value))
                        }
                        className="w-full border rounded-lg px-3 py-2"
                        min="0"
                        step="0.01"
                        max={discountType === "percentage" ? 100 : undefined}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Beskrivning
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="T.ex. Lojalitetsrabatt, Pensionärsrabatt..."
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isPermanent}
                        onChange={(e) => setIsPermanent(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">
                        Permanent rabatt
                      </span>
                    </label>

                    {!isPermanent && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Gäller från
                          </label>
                          <input
                            type="date"
                            value={validFrom}
                            onChange={(e) => setValidFrom(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Gäller till
                          </label>
                          <input
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading
                        ? "Sparar..."
                        : editingDiscount
                        ? "Uppdatera"
                        : "Skapa"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Avbryt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
