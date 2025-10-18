"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { PawPrint, Heart, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Organization = Database["public"]["Tables"]["orgs"]["Row"];

interface FormData {
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  dog_name: string;
  dog_breed: string;
  dog_age: number | null;
  dog_size: "small" | "medium" | "large" | "";
  preferred_start_date: string;
  preferred_days: string[];
  special_needs: string;
  previous_daycare_experience: boolean;
  selected_org_id: string;
}

/**
 * Publik ansökningssida för intresseanmälan till hunddagis
 * [ERR-1001] Databaskoppling, [ERR-2001] Formulärvalidering, [ERR-4001] Skicka ansökan
 */
export default function AnsokanPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    dog_name: "",
    dog_breed: "",
    dog_age: null,
    dog_size: "",
    preferred_start_date: "",
    preferred_days: [],
    special_needs: "",
    previous_daycare_experience: false,
    selected_org_id: "",
  });

  const dayOptions = [
    { value: "monday", label: "Måndag" },
    { value: "tuesday", label: "Tisdag" },
    { value: "wednesday", label: "Onsdag" },
    { value: "thursday", label: "Torsdag" },
    { value: "friday", label: "Fredag" },
  ];

  const sizeOptions = [
    { value: "small", label: "Liten (under 15kg)" },
    { value: "medium", label: "Medium (15-30kg)" },
    { value: "large", label: "Stor (över 30kg)" },
  ];

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      // Tillfälligt hårdkodade organisationer för testning
      const mockOrganizations: Organization[] = [
        {
          id: "mock-1",
          name: "Hunddagis Stockholm",
          address: "Stockholmsvägen 123",
          phone: "08-123 45 67",
          email: "info@hunddagis-stockholm.se",
          org_number: null,
          vat_included: true,
          vat_rate: 25,
          created_at: "",
          updated_at: "",
        },
        {
          id: "mock-2",
          name: "Djurvännerna Göteborg",
          address: "Göteborgsvägen 456",
          phone: "031-987 65 43",
          email: "kontakt@djurvannerna.se",
          org_number: null,
          vat_included: true,
          vat_rate: 25,
          created_at: "",
          updated_at: "",
        },
      ];

      setOrganizations(mockOrganizations);

      /* TODO: Aktivera när databasen är korrekt konfigurerad
      const { data, error } = await supabase
        .from("orgs")
        .select("id, name, address, phone, email")
        .contains("modules_enabled", ["daycare"]) // Endast hunddagis
        .order("name");

      if (error) {
        throw new Error(`[ERR-1001] Databaskoppling: ${error.message}`);
      }

      setOrganizations(data || []);
      */
    } catch (err: any) {
      console.error("Error loading organizations:", err);
      setError(err.message || "[ERR-1001] Kunde inte ladda hunddagis");
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter((d) => d !== day)
        : [...prev.preferred_days, day],
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.parent_name.trim())
      return "[ERR-2001] Förälderns namn är obligatoriskt";
    if (!formData.parent_email.trim())
      return "[ERR-2001] E-post är obligatoriskt";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email))
      return "[ERR-2001] Ogiltig e-postadress";
    if (!formData.parent_phone.trim())
      return "[ERR-2001] Telefonnummer är obligatoriskt";
    if (!formData.dog_name.trim())
      return "[ERR-2001] Hundens namn är obligatoriskt";
    if (!formData.dog_size) return "[ERR-2001] Hundens storlek måste anges";
    if (!formData.selected_org_id)
      return "[ERR-2001] Du måste välja ett hunddagis";
    if (formData.preferred_days.length === 0)
      return "[ERR-2001] Välj minst en önskad dag";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Tillfälligt: bara visa success för testning av UI
      console.log("Ansökningsdata:", {
        org_id: formData.selected_org_id,
        parent_name: formData.parent_name.trim(),
        parent_email: formData.parent_email.trim().toLowerCase(),
        parent_phone: formData.parent_phone.trim(),
        dog_name: formData.dog_name.trim(),
        dog_breed: formData.dog_breed.trim() || null,
        dog_age: formData.dog_age || null,
        dog_size: formData.dog_size,
        preferred_start_date: formData.preferred_start_date || null,
        preferred_days:
          formData.preferred_days.length > 0 ? formData.preferred_days : null,
        special_needs: formData.special_needs.trim() || null,
        previous_daycare_experience: formData.previous_daycare_experience,
        status: "pending",
      });

      // Simulera API-anrop
      await new Promise((resolve) => setTimeout(resolve, 1000));

      /* TODO: Aktivera när databasen är korrekt konfigurerad
      const applicationData: Database["public"]["Tables"]["interest_applications"]["Insert"] = {
        org_id: formData.selected_org_id,
        parent_name: formData.parent_name.trim(),
        parent_email: formData.parent_email.trim().toLowerCase(),
        parent_phone: formData.parent_phone.trim(),
        dog_name: formData.dog_name.trim(),
        dog_breed: formData.dog_breed.trim() || null,
        dog_age: formData.dog_age || null,
        dog_size: formData.dog_size as "small" | "medium" | "large",
        preferred_start_date: formData.preferred_start_date || null,
        preferred_days: formData.preferred_days.length > 0 ? formData.preferred_days : null,
        special_needs: formData.special_needs.trim() || null,
        previous_daycare_experience: formData.previous_daycare_experience,
        status: "pending",
        notes: null
      };

      const { error } = await supabase
        .from("interest_applications")
        .insert(applicationData);

      if (error) {
        throw new Error(`[ERR-4001] Kunde inte skicka ansökan: ${error.message}`);
      }
      */

      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting application:", err);
      setError(err.message || "[ERR-4001] Ett oväntat fel uppstod");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Laddar hunddagis...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ansökan skickad!
            </h2>
            <p className="text-gray-600 mb-6">
              Tack för din intresseanmälan. Hunddagiset kommer att kontakta dig
              inom kort.
            </p>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till startsidan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <PawPrint className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ansök om hunddagisplats
          </h1>
          <p className="text-gray-600">
            Fyll i formuläret nedan för att ansöka om en plats på hunddagiset
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-green-600" />
              Intresseanmälan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Välj hunddagis */}
              <div>
                <Label
                  htmlFor="organization"
                  className="text-green-700 font-medium"
                >
                  Välj hunddagis *
                </Label>
                <Select
                  value={formData.selected_org_id}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, selected_org_id: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Välj det hunddagis du vill ansöka till..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          {org.address && (
                            <div className="text-sm text-gray-500">
                              {org.address}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Förälder/ägare information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Dina uppgifter
                </h3>

                <div>
                  <Label htmlFor="parent_name" className="text-green-700">
                    Ditt namn *
                  </Label>
                  <Input
                    id="parent_name"
                    type="text"
                    value={formData.parent_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parent_name: e.target.value,
                      }))
                    }
                    placeholder="För- och efternamn"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="parent_email" className="text-green-700">
                    E-post *
                  </Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parent_email: e.target.value,
                      }))
                    }
                    placeholder="din@email.se"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="parent_phone" className="text-green-700">
                    Telefonnummer *
                  </Label>
                  <Input
                    id="parent_phone"
                    type="tel"
                    value={formData.parent_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parent_phone: e.target.value,
                      }))
                    }
                    placeholder="070-123 45 67"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Hund information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Om din hund
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dog_name" className="text-green-700">
                      Hundens namn *
                    </Label>
                    <Input
                      id="dog_name"
                      type="text"
                      value={formData.dog_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dog_name: e.target.value,
                        }))
                      }
                      placeholder="Bella"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dog_breed" className="text-green-700">
                      Ras
                    </Label>
                    <Input
                      id="dog_breed"
                      type="text"
                      value={formData.dog_breed}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dog_breed: e.target.value,
                        }))
                      }
                      placeholder="Golden Retriever"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dog_age" className="text-green-700">
                      Ålder (år)
                    </Label>
                    <Input
                      id="dog_age"
                      type="number"
                      min="0"
                      max="20"
                      value={formData.dog_age || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dog_age: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        }))
                      }
                      placeholder="3"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dog_size" className="text-green-700">
                      Storlek *
                    </Label>
                    <Select
                      value={formData.dog_size}
                      onValueChange={(value: string) =>
                        setFormData((prev) => ({
                          ...prev,
                          dog_size: value as "small" | "medium" | "large",
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Välj storlek..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Önskemål */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Önskemål</h3>

                <div>
                  <Label
                    htmlFor="preferred_start_date"
                    className="text-green-700"
                  >
                    Önskat startdatum
                  </Label>
                  <Input
                    id="preferred_start_date"
                    type="date"
                    value={formData.preferred_start_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preferred_start_date: e.target.value,
                      }))
                    }
                    className="mt-1"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <Label className="text-green-700">Önskade dagar *</Label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {dayOptions.map((day) => (
                      <div key={day.value} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={day.value}
                          checked={formData.preferred_days.includes(day.value)}
                          onChange={() => handleDayToggle(day.value)}
                          className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <Label
                          htmlFor={day.value}
                          className="text-sm text-gray-700"
                        >
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="special_needs" className="text-green-700">
                    Särskilda behov eller information
                  </Label>
                  <Textarea
                    id="special_needs"
                    value={formData.special_needs}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        special_needs: e.target.value,
                      }))
                    }
                    placeholder="Berätta om din hund har särskilda behov, allergier, mediciner eller annan viktig information..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="previous_experience"
                    checked={formData.previous_daycare_experience}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        previous_daycare_experience: e.target.checked,
                      }))
                    }
                    className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <Label
                    htmlFor="previous_experience"
                    className="text-sm text-gray-700"
                  >
                    Min hund har tidigare erfarenhet av hunddagis
                  </Label>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Skickar ansökan...
                    </>
                  ) : (
                    "Skicka intresseanmälan"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                * Obligatoriska fält. Dina uppgifter behandlas konfidentiellt
                enligt GDPR.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
