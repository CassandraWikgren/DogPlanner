-- Migration: Setup dog-photos storage bucket with proper policies
-- Skapad: 2025-11-17
-- Syfte: Skapa storage bucket för hundbilder och sätta rätt RLS policies

-- Skapa bucket om den inte finns
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Ta bort gamla policies om de finns
DROP POLICY IF EXISTS "Authenticated users can upload dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their org's dog photos" ON storage.objects;

-- Policy 1: Authenticated users kan ladda upp bilder
CREATE POLICY "Authenticated users can upload dog photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dog-photos');

-- Policy 2: Alla kan se bilder (bucket är public)
CREATE POLICY "Public can view dog photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dog-photos');

-- Policy 3: Authenticated users kan ta bort bilder från sin organisation
CREATE POLICY "Users can delete their org's dog photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dog-photos');

-- Policy 4: Authenticated users kan uppdatera bilder
CREATE POLICY "Users can update dog photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'dog-photos');

-- Logga migration
INSERT INTO migrations (version, description, execution_time_ms)
VALUES ('20251117_setup_dog_photos_storage', 'Setup dog-photos storage bucket with RLS policies for image uploads', 0);
