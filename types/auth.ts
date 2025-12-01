/**
 * AUTH TYPES - Centrala typdefinitioner för autentisering
 *
 * Dessa typer säkerställer type safety genom hela applikationen
 * och eliminerar behovet av 'as any' casts.
 *
 * Skapad: 2025-12-01
 */

import { User as SupabaseAuthUser } from "@supabase/supabase-js";

/**
 * Användarmetadata som lagras i Supabase Auth user_metadata
 */
export interface UserMetadata {
  org_id?: string;
  org_name?: string;
  org_number?: string;
  full_name?: string;
  phone?: string;
  email?: string;
}

/**
 * App-specifik metadata som lagras i Supabase Auth app_metadata
 */
export interface AppMetadata {
  role?: "owner" | "staff" | "groomer" | "admin";
  provider?: string;
  providers?: string[];
}

/**
 * Utökad Supabase User med typade metadata
 * Använd denna typ istället för 'any' genom hela applikationen
 */
export interface DogPlannerUser
  extends Omit<SupabaseAuthUser, "user_metadata" | "app_metadata"> {
  user_metadata: UserMetadata;
  app_metadata: AppMetadata;
}

/**
 * Profile från profiles-tabellen i databasen
 */
export interface UserProfile {
  id: string;
  user_id: string;
  org_id: string | null;
  full_name: string | null;
  phone: string | null;
  role: "owner" | "staff" | "groomer" | "admin";
  created_at: string;
  updated_at: string | null;
}

/**
 * Session-data som används i AuthContext
 */
export interface AuthSession {
  user: DogPlannerUser;
  profile: UserProfile | null;
  currentOrgId: string | null;
}

/**
 * Type guard för att kontrollera om användare har metadata
 */
export function hasUserMetadata(
  user: SupabaseAuthUser | null
): user is DogPlannerUser {
  return user !== null && typeof user.user_metadata === "object";
}

/**
 * Type guard för att kontrollera om användare har org_id
 */
export function hasOrgId(user: SupabaseAuthUser | null): boolean {
  return hasUserMetadata(user) && typeof user.user_metadata.org_id === "string";
}

/**
 * Säker extraktion av org_id från user
 * Returnerar null om org_id saknas
 */
export function getOrgIdFromUser(user: SupabaseAuthUser | null): string | null {
  if (!hasUserMetadata(user)) return null;
  return user.user_metadata.org_id || null;
}

/**
 * Säker extraktion av användarens roll
 * Returnerar 'owner' som default
 */
export function getRoleFromUser(
  user: SupabaseAuthUser | null
): "owner" | "staff" | "groomer" | "admin" {
  if (!hasUserMetadata(user)) return "owner";
  return user.app_metadata.role || "owner";
}
