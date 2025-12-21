"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

export type ServiceType = "daycare" | "boarding" | "grooming";

interface EnabledServicesReturn {
  services: ServiceType[];
  hasGrooming: boolean;
  hasDaycare: boolean;
  hasBoarding: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook för att kontrollera vilka tjänster organisationen har aktiverade
 * Används för att dölja/visa moduler baserat på vad företaget erbjuder
 * @returns Object med flags för varje tjänst + array med alla tjänster
 */
export function useEnabledServices(): EnabledServicesReturn {
  const { currentOrgId, loading: authLoading, isCustomer } = useAuth();

  const [services, setServices] = useState<ServiceType[]>([]);
  // Start som true och håll loading tills vi faktiskt har data
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⏱️ Safety timeout - om loading tar mer än 3 sekunder, fallback till alla tjänster
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (loading && !hasFetched) {
        console.warn(
          "useEnabledServices: Timeout reached, using fallback services"
        );
        setServices(["daycare", "boarding", "grooming"]);
        setLoading(false);
        setHasFetched(true);
      }
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, hasFetched]);

  const loadServices = async () => {
    // Vänta på att auth ska bli klar
    if (authLoading) {
      return; // Håll loading=true tills auth är klar
    }

    // Om vi redan har hämtat, gör inget
    if (hasFetched && services.length > 0) {
      setLoading(false);
      return;
    }

    // If user is a customer (no org_id), they don't need services
    if (isCustomer) {
      setServices([]);
      setLoading(false);
      setHasFetched(true);
      return;
    }

    // For staff: if no currentOrgId after auth is done, use fallback
    if (!currentOrgId) {
      // Om authLoading är false men currentOrgId fortfarande saknas, använd fallback
      if (!authLoading) {
        console.warn(
          "useEnabledServices: No currentOrgId after auth, using fallback"
        );
        setServices(["daycare", "boarding", "grooming"]);
        setLoading(false);
        setHasFetched(true);
      }
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orgs")
        .select("enabled_services")
        .eq("id", currentOrgId)
        .single();

      if (error) {
        console.error("❌ Fel vid hämtning av enabled_services:", error);
        // Fallback: alla tjänster om något går fel (säkerhet)
        setServices(["daycare", "boarding", "grooming"]);
      } else {
        const enabledServices = (data?.enabled_services as ServiceType[]) || [];
        // Om arrayen är tom, sätt default till alla tjänster (säkerhet)
        setServices(
          enabledServices.length > 0
            ? enabledServices
            : ["daycare", "boarding", "grooming"]
        );
      }
    } catch (err) {
      console.error("❌ Exception i useEnabledServices:", err);
      // Fallback: alla tjänster om något går fel
      setServices(["daycare", "boarding", "grooming"]);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    loadServices();
  }, [currentOrgId, authLoading, isCustomer]);

  return {
    services,
    hasGrooming: services.includes("grooming"),
    hasDaycare: services.includes("daycare"),
    hasBoarding: services.includes("boarding"),
    loading,
    refresh: loadServices,
  };
}
