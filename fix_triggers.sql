-- Först, kolla vilka triggers som finns
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_schema = 'public';

-- Kolla om user_id kolumnen finns i orgs
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orgs' 
AND column_name = 'user_id';

-- Om user_id kolumnen saknas, lägg till den
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Eller alternativt, ta bort triggern tillfälligt
-- DROP TRIGGER IF EXISTS set_org_user_trigger ON public.orgs;

-- Kolla trigger-funktionen
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%org%user%';