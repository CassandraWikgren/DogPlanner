-- ================================================
-- FAS 6: Storage bucket för GDPR-dokument
-- ================================================
-- Skapar bucket för uppladdning av fysiska samtyckeblanketter
-- GDPR Art. 32: Säkerhet för personuppgifter

-- Skapa bucket för dokument (privat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- OBS: RLS policies för storage.objects måste skapas via Supabase Dashboard:
-- Gå till Storage > documents bucket > Policies
-- Eller kör dessa kommandon via Supabase CLI
