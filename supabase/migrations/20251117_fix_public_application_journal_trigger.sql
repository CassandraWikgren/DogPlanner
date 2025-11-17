-- FIX: Allow public boarding applications to work
-- Problem: create_dog_journal_on_new_dog trigger failed when auth.uid() was NULL (public users)
-- Solution: Only create journal entry if user is logged in

CREATE OR REPLACE FUNCTION create_dog_journal_on_new_dog()
RETURNS trigger AS $$
BEGIN
  -- Skapa journal post endast om user_id finns (användaren är inloggad)
  -- För publika ansökningar (auth.uid() är NULL) skippar vi detta
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO dog_journal (org_id, dog_id, user_id, entry_type, content)
    VALUES (NEW.org_id, NEW.id, auth.uid(), 'note', 'Hund registrerad i systemet');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ingen ändring av trigger behövs, bara funktionen uppdateras
