-- Backfill orphaned users: create org + profile when missing
-- Safe to run multiple times.

DO $$
DECLARE
  rec RECORD;
  v_org_id uuid;
BEGIN
  FOR rec IN (
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE p.id IS NULL
  ) LOOP
    -- Create org for this user
    INSERT INTO orgs (name, email, vat_included, vat_rate)
    VALUES (
      COALESCE(split_part(rec.email, '@', 1), 'Kund') || 's Hunddagis',
      rec.email,
      true,
      25
    ) RETURNING id INTO v_org_id;

    -- Create profile for this user pointing to the new org
    INSERT INTO profiles (id, org_id, role, email, full_name)
    VALUES (rec.id, v_org_id, 'admin', rec.email, split_part(rec.email, '@', 1))
    ON CONFLICT (id) DO UPDATE SET org_id = EXCLUDED.org_id, role = EXCLUDED.role;

    RAISE NOTICE 'Backfilled user % with org %', rec.id, v_org_id;
  END LOOP;
END $$;

-- Optional: Attach any data rows missing org_id to their owner's org
-- (Run with care; adjust to your data hygiene rules.)
-- UPDATE dogs d
-- SET org_id = o.org_id
-- FROM owners o
-- WHERE d.owner_id = o.id AND d.org_id IS NULL;