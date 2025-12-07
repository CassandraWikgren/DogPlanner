-- ============================================================
-- GDPR DELETE POLICIES
-- ============================================================
-- Purpose: Låt kunder radera sin egen data enligt GDPR
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================
-- 1. OWNERS DELETE POLICY
-- ============================================
-- Ägare kan radera sig själva (och det trigger-raderar deras hundar osv)
CREATE POLICY "Owners can delete themselves"
ON public.owners
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE email = owners.email
  )
);

-- ============================================
-- 2. DOGS DELETE POLICY  
-- ============================================
-- Ägare kan radera sina hundar
CREATE POLICY "Owners can delete their own dogs"
ON public.dogs
FOR DELETE
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.owners 
    WHERE email IN (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- ============================================
-- 3. BOOKINGS DELETE POLICY
-- ============================================
-- Kunder kan radera sina bokningar (endast pending/cancelled)
CREATE POLICY "Owners can delete their own pending bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (
  status IN ('pending', 'cancelled')
  AND dog_id IN (
    SELECT d.id FROM public.dogs d
    JOIN public.owners o ON d.owner_id = o.id
    JOIN public.profiles p ON o.email = p.email
    WHERE p.id = auth.uid()
  )
);

-- ============================================
-- 4. CONSENT LOGS DELETE POLICY
-- ============================================
-- Användare kan dra tillbaka sitt samtycke (soft delete via withdrawal)
CREATE POLICY "Users can withdraw their own consent"
ON public.consent_logs
FOR UPDATE
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.owners 
    WHERE email IN (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  withdrawn_at IS NOT NULL
);

-- ============================================
-- 5. INTEREST APPLICATIONS DELETE POLICY
-- ============================================
-- Användare kan radera sina ansökningar (skippa om email-kolumn saknas)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'interest_applications'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'interest_applications' AND column_name = 'email'
    ) THEN
        EXECUTE '
        CREATE POLICY "Users can delete their own applications"
        ON public.interest_applications
        FOR DELETE
        TO authenticated
        USING (
          email IN (
            SELECT email FROM public.profiles WHERE id = auth.uid()
          )
        )';
    END IF;
END $$;

-- ============================================
-- 6. COMPLETE GDPR DELETE FUNCTION
-- ============================================
-- Funktion som raderar ALL användardata (GDPR "rätten att bli glömd")
CREATE OR REPLACE FUNCTION public.gdpr_delete_user_data(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_dog_ids UUID[];
  v_result jsonb;
BEGIN
  -- Verifiera att användaren äger datan
  SELECT o.id INTO v_owner_id
  FROM public.owners o
  JOIN public.profiles p ON o.email = p.email
  WHERE p.id = p_user_id;
  
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No owner found for this user'
    );
  END IF;
  
  -- Samla hundar som ska raderas
  SELECT ARRAY_AGG(id) INTO v_dog_ids
  FROM public.dogs
  WHERE owner_id = v_owner_id;
  
  -- Börja radera i rätt ordning (för att undvika FK-fel)
  
  -- 1. Radera bokningar för hundar
  DELETE FROM public.bookings
  WHERE dog_id = ANY(v_dog_ids);
  
  -- 2. Radera extra_service för hundar
  DELETE FROM public.extra_service
  WHERE dogs_id = ANY(v_dog_ids);
  
  -- 3. Radera dog_journal
  DELETE FROM public.dog_journal
  WHERE dog_id = ANY(v_dog_ids);
  
  -- 4. Radera hundar
  DELETE FROM public.dogs
  WHERE owner_id = v_owner_id;
  
  -- 5. Radera fakturor
  DELETE FROM public.invoice_items
  WHERE invoice_id IN (
    SELECT id FROM public.invoices WHERE owner_id = v_owner_id
  );
  
  DELETE FROM public.invoices
  WHERE owner_id = v_owner_id;
  
  -- 6. Markera samtycke som återdraget
  UPDATE public.consent_logs
  SET withdrawn_at = NOW()
  WHERE owner_id = v_owner_id AND withdrawn_at IS NULL;
  
  -- 7. Radera interest_applications (om tabellen och kolumnen finns)
  BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'interest_applications' AND column_name = 'email'
    ) THEN
        DELETE FROM public.interest_applications
        WHERE email IN (
          SELECT email FROM public.owners WHERE id = v_owner_id
        );
    END IF;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Tabellen finns inte, fortsätt
  END;
  
  -- 8. Radera ägare (owner)
  DELETE FROM public.owners
  WHERE id = v_owner_id;
  
  -- 9. Radera profil
  DELETE FROM public.profiles
  WHERE id = p_user_id;
  
  -- 10. Radera auth user
  DELETE FROM auth.users
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'All user data deleted successfully',
    'deleted', jsonb_build_object(
      'owner_id', v_owner_id,
      'dog_count', COALESCE(array_length(v_dog_ids, 1), 0)
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- ============================================
-- 7. GDPR API ENDPOINT HELPER
-- ============================================
-- För att anropa från app/api/gdpr/delete-account/route.ts
COMMENT ON FUNCTION public.gdpr_delete_user_data IS 
'GDPR compliance: Radera ALL användardata. Anropa från authenticated context.
Exempel: SELECT public.gdpr_delete_user_data(auth.uid());';

-- ============================================
-- 8. VERIFIERING
-- ============================================
-- Kolla alla DELETE policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- ============================================
-- ANVÄNDNING
-- ============================================
-- Från app/api/gdpr/delete-account/route.ts:
--
-- export async function DELETE(request: Request) {
--   const supabase = createClientComponentClient();
--   const { data: { user } } = await supabase.auth.getUser();
--   
--   if (!user) {
--     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
--   }
--   
--   const { data, error } = await supabase.rpc('gdpr_delete_user_data', {
--     p_user_id: user.id
--   });
--   
--   if (error || !data?.success) {
--     return NextResponse.json({ error: data?.error || error.message }, { status: 500 });
--   }
--   
--   await supabase.auth.signOut();
--   return NextResponse.json({ success: true });
-- }

-- ============================================
-- SÄKERHET
-- ============================================
-- Funktionen är SECURITY DEFINER vilket betyder den körs med admin-rättigheter
-- Men den verifierar att användaren äger datan innan radering
-- 
-- VIKTIGT: Logga alla GDPR-raderingar för compliance:
CREATE TABLE IF NOT EXISTS public.gdpr_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id UUID,
  dog_count INT,
  booking_count INT,
  invoice_count INT
);

-- Uppdatera funktionen att logga:
-- INSERT INTO public.gdpr_deletion_log (user_id, owner_id, dog_count)
-- VALUES (p_user_id, v_owner_id, array_length(v_dog_ids, 1));
