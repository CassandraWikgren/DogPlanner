"use client";

import {
  useEnabledServices,
  ServiceType,
} from "@/lib/hooks/useEnabledServices";
import { ReactNode } from "react";

interface ServiceGuardProps {
  service: ServiceType;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Guard-komponent som visar/döljer innehåll baserat på enabled_services
 * Används för att dölja menylänkar och sidor som inte är relevanta för företaget
 *
 * @param service - Vilken tjänst som krävs (daycare, boarding, grooming)
 * @param children - Innehåll att visa om tjänsten är aktiverad
 * @param fallback - Alternativt innehåll om tjänsten INTE är aktiverad (optional)
 *
 * @example
 * <ServiceGuard service="grooming">
 *   <Link href="/frisor">Hundfrisör</Link>
 * </ServiceGuard>
 */
export function ServiceGuard({
  service,
  children,
  fallback = null,
}: ServiceGuardProps) {
  const { services, loading } = useEnabledServices();

  // Visa ingenting under laddning (undvik "flash" av innehåll som sen försvinner)
  if (loading) {
    return null;
  }

  // Kolla om tjänsten är aktiverad
  if (!services.includes(service)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Multi-service guard - visa innehåll om NÅGON av tjänsterna är aktiverad
 *
 * @example
 * <AnyServiceGuard services={["daycare", "boarding"]}>
 *   <Link href="/ekonomi">Ekonomi</Link>
 * </AnyServiceGuard>
 */
export function AnyServiceGuard({
  services,
  children,
  fallback = null,
}: {
  services: ServiceType[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { services: enabledServices, loading } = useEnabledServices();

  if (loading) return null;

  const hasAny = services.some((s) => enabledServices.includes(s));

  if (!hasAny) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * All-service guard - visa innehåll endast om ALLA tjänster är aktiverade
 *
 * @example
 * <AllServicesGuard services={["daycare", "boarding", "grooming"]}>
 *   <div>Du har tillgång till alla moduler!</div>
 * </AllServicesGuard>
 */
export function AllServicesGuard({
  services,
  children,
  fallback = null,
}: {
  services: ServiceType[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { services: enabledServices, loading } = useEnabledServices();

  if (loading) return null;

  const hasAll = services.every((s) => enabledServices.includes(s));

  if (!hasAll) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
