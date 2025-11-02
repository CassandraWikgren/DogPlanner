-- 2025-11-02
-- RLS policy för profiles: användare kan läsa sin egen profil
-- Detta är KRITISKT för att AuthContext ska kunna ladda profilen på klientsidan

BEGIN;

-- Säkerställ att RLS är aktiverat på profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Skapa policy för att användare kan läsa sin egen profil
-- DROP först om den finns (för idempotens)
DROP POLICY IF EXISTS profiles_self_access ON public.profiles;

CREATE POLICY profiles_self_access
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Lägg även till INSERT-policy så auto-onboarding kan skapa profiler via upsert
DROP POLICY IF EXISTS profiles_self_insert ON public.profiles;

CREATE POLICY profiles_self_insert
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Lägg till UPDATE-policy så användare kan uppdatera sin egen profil
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;

CREATE POLICY profiles_self_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;
