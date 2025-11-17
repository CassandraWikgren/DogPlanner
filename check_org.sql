-- Kolla Cassandras organisation
SELECT 
  id,
  name,
  org_number,
  lan,
  kommun,
  service_types,
  is_visible_to_customers,
  created_at
FROM orgs 
WHERE org_number LIKE '%cassandra%' 
   OR name ILIKE '%cassandra%'
   OR id IN (
     SELECT org_id FROM profiles WHERE email = 'cassandrawikgren@icloud.com'
   )
LIMIT 5;

-- Om ingen hittas, visa alla orgs
SELECT 
  id,
  name, 
  org_number,
  lan,
  kommun,
  service_types,
  is_visible_to_customers
FROM orgs
ORDER BY created_at DESC
LIMIT 5;
