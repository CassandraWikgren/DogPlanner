[
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "Allow read attendance_logs for active or locked orgs",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM ((profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n     JOIN dogs d ON ((d.id = attendance_logs.dogs_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = d.org_id) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "Block changes to attendance_logs for locked orgs",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM ((profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n     JOIN dogs d ON ((d.id = attendance_logs.dogs_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = d.org_id) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM ((profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n     JOIN dogs d ON ((d.id = attendance_logs.dogs_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = d.org_id) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "attendance_logs_all_policy",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM dogs\n  WHERE ((dogs.id = attendance_logs.dogs_id) AND (dogs.org_id = get_user_org_id()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM dogs\n  WHERE ((dogs.id = attendance_logs.dogs_id) AND (dogs.org_id = get_user_org_id()))))"
  },
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "attendance_logs_select_policy",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM dogs\n  WHERE ((dogs.id = attendance_logs.dogs_id) AND (dogs.org_id = get_user_org_id()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "boarding_seasons",
    "policyname": "Enable all for authenticated users on boarding_seasons",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "booking_events",
    "policyname": "Customers can view own booking events",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(booking_id IN ( SELECT b.id\n   FROM (bookings b\n     JOIN dogs d ON ((b.dog_id = d.id)))\n  WHERE (d.owner_id IN ( SELECT owners.id\n           FROM owners\n          WHERE (owners.user_id = auth.uid())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "booking_events",
    "policyname": "Only system can create events",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "false"
  },
  {
    "schemaname": "public",
    "tablename": "booking_events",
    "policyname": "Staff can view booking events",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "booking_services",
    "policyname": "booking_services_all_policy",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM bookings\n  WHERE ((bookings.id = booking_services.booking_id) AND (bookings.org_id = get_user_org_id()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM bookings\n  WHERE ((bookings.id = booking_services.booking_id) AND (bookings.org_id = get_user_org_id()))))"
  },
  {
    "schemaname": "public",
    "tablename": "booking_services",
    "policyname": "booking_services_select_policy",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM bookings\n  WHERE ((bookings.id = booking_services.booking_id) AND (bookings.org_id = get_user_org_id()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "bookings",
    "policyname": "Owners can delete their own pending bookings",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "((status = ANY (ARRAY['pending'::text, 'cancelled'::text])) AND (dog_id IN ( SELECT d.id\n   FROM ((dogs d\n     JOIN owners o ON ((d.owner_id = o.id)))\n     JOIN profiles p ON ((o.email = p.email)))\n  WHERE (p.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "bookings",
    "policyname": "bookings_public_insert",
    "roles": "{anon,authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "bookings",
    "policyname": "bookings_select_by_org_or_owner",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "bookings",
    "policyname": "bookings_update_by_org_or_owner",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR ((owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))) AND (status = 'pending'::text)))",
    "with_check": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR ((owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))) AND (status = 'pending'::text)))"
  },
  {
    "schemaname": "public",
    "tablename": "consent_logs",
    "policyname": "Users can withdraw their own consent",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.email IN ( SELECT profiles.email\n           FROM profiles\n          WHERE (profiles.id = auth.uid())))))",
    "with_check": "(withdrawn_at IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "consent_logs",
    "policyname": "consent_org_select",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "consent_logs",
    "policyname": "consent_public_insert",
    "roles": "{anon,authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "daycare_pricing",
    "policyname": "authenticated_full_access_daycare_pricing",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "daycare_service_completions",
    "policyname": "daycare_service_completions_all_policy",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())\n LIMIT 1))",
    "with_check": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())\n LIMIT 1))"
  },
  {
    "schemaname": "public",
    "tablename": "daycare_service_completions",
    "policyname": "daycare_service_completions_select_policy",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())\n LIMIT 1))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "Allow org members to manage dog journals",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "Allow org members to view dog journals",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal insert",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal select",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.org_id = dog_journal.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_all",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM dogs d\n  WHERE ((d.id = dog_journal.dog_id) AND (d.org_id = current_org_id()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM dogs d\n  WHERE ((d.id = dog_journal.dog_id) AND (d.org_id = current_org_id()))))"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_delete",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.org_id = dog_journal.org_id) AND (p.role = 'admin'::text))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_insert",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_select",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.org_id = dog_journal.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_update",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.org_id = dog_journal.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "insert_dog_journal_in_org",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "select_dog_journal_in_org",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((org_id = auth.uid()) OR (org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dogs",
    "policyname": "Owners can delete their own dogs",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.email IN ( SELECT profiles.email\n           FROM profiles\n          WHERE (profiles.id = auth.uid())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dogs",
    "policyname": "dogs_public_insert",
    "roles": "{anon,authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "dogs",
    "policyname": "dogs_select_by_org_or_owner",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dogs",
    "policyname": "dogs_update_by_org_or_owner",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))))",
    "with_check": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "error_logs",
    "policyname": "error_logs_insert_policy",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "error_logs",
    "policyname": "error_logs_select_admin_policy",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "external_customers",
    "policyname": "Users can insert external customers in their org",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "external_customers",
    "policyname": "Users can update external customers in their org",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "external_customers",
    "policyname": "Users can view external customers in their org",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "Allow read extra_service for active or locked orgs",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = extra_service.org_id) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "Block changes to extra_service for locked orgs",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = extra_service.org_id) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = extra_service.org_id) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "Org members can modify org extra_service",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = extra_service.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "Org members can read org extra_service",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = extra_service.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "allow_select_extra_service",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "delete_own_org",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_all",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM dogs d\n  WHERE ((d.id = extra_service.dogs_id) AND (d.org_id = current_org_id()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM dogs d\n  WHERE ((d.id = extra_service.dogs_id) AND (d.org_id = current_org_id()))))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_delete",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_insert",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_select",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_update",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "insert_own_org",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((org_id IS NULL) OR (org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "select_own_org",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "update_own_org",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_services",
    "policyname": "Allow all for authenticated users",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "function_logs",
    "policyname": "Admins can view function logs",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.role = 'admin'::text)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "function_logs",
    "policyname": "function_logs_insert_policy",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "function_logs",
    "policyname": "function_logs_select_admin_policy",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "grooming_logs",
    "policyname": "Org members can modify org grooming logs",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = grooming_logs.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "grooming_logs",
    "policyname": "Org members can read org grooming logs",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = grooming_logs.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "grooming_prices",
    "policyname": "grooming_delete",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "grooming_prices",
    "policyname": "grooming_insert",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "grooming_prices",
    "policyname": "grooming_select",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "grooming_prices",
    "policyname": "grooming_update",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "grooming_services",
    "policyname": "authenticated_full_access_grooming_services",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Allow anonymous insert for public applications",
    "roles": "{anon}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Users can delete their org's interest applications",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Users can insert interest applications for their org",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Users can update their org's interest applications",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Users can view their org's interest applications",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "interest_org_select",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "admin_full_access_invoice_items",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE (invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))))) AND (( SELECT profiles.role\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = 'admin'::text))",
    "with_check": "((invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE (invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))))) AND (( SELECT profiles.role\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = 'admin'::text))"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "invoice_items_all_policy",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM invoices\n  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.org_id = get_user_org_id()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM invoices\n  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.org_id = get_user_org_id()))))"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "invoice_items_select_policy",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM invoices\n  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.org_id = get_user_org_id()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "select_own_org_invoice_items",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE (invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "staff_edit_draft_invoice_items",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE ((invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))) AND (invoices.status = 'draft'::text)))) AND (( SELECT profiles.role\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = 'staff'::text))",
    "with_check": "((invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE ((invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))) AND (invoices.status = 'draft'::text)))) AND (( SELECT profiles.role\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = 'staff'::text))"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_runs",
    "policyname": "invoice_runs_admin_policy",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text])))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text])))))"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_runs",
    "policyname": "invoice_runs_select_policy",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IS NOT NULL)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoices",
    "policyname": "admin_can_send_invoices",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.org_id = invoices.org_id) AND (profiles.role = 'admin'::text)))) AND (status = 'draft'::text))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoices",
    "policyname": "insert_invoices_in_org",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "invoices",
    "policyname": "select_invoices_in_org",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoices",
    "policyname": "update_invoices_in_org",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "org_email_history",
    "policyname": "Service role only insert",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.role() = 'service_role'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "org_email_history",
    "policyname": "Service role only read",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.role() = 'service_role'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "org_number_subscription_history",
    "policyname": "Service role only read",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.role() = 'service_role'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "org_number_subscription_history",
    "policyname": "Service role only write",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'service_role'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "orgs",
    "policyname": "orgs_members_all",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "orgs",
    "policyname": "orgs_public_select",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "owner_discounts",
    "policyname": "Admins can manage discounts",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "owner_discounts",
    "policyname": "Users can view discounts in their org",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "owners",
    "policyname": "Owners can delete themselves",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.email = owners.email)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "owners",
    "policyname": "Users can view owners in their org",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "owners",
    "policyname": "owners_public_insert",
    "roles": "{anon,authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "owners",
    "policyname": "owners_select_by_org_or_self",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (id = auth.uid()))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "owners",
    "policyname": "owners_update_by_org_or_self",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (id = auth.uid()))",
    "with_check": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (id = auth.uid()))"
  },
  {
    "schemaname": "public",
    "tablename": "price_lists",
    "policyname": "Allow read price lists for active or locked orgs",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = price_lists.org_id) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "price_lists",
    "policyname": "Block changes to price lists for locked orgs",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = price_lists.org_id) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = price_lists.org_id) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "price_lists",
    "policyname": "Org members can modify org price_lists",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = price_lists.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "price_lists",
    "policyname": "Org members can read org price_lists",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = price_lists.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pricing",
    "policyname": "Users can delete pricing for their org",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(org_id IN ( SELECT orgs.id\n   FROM orgs\n  WHERE (orgs.id = ((auth.jwt() ->> 'org_id'::text))::uuid)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pricing",
    "policyname": "Users can insert pricing for their org",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT orgs.id\n   FROM orgs\n  WHERE (orgs.id = ((auth.jwt() ->> 'org_id'::text))::uuid)))"
  },
  {
    "schemaname": "public",
    "tablename": "pricing",
    "policyname": "Users can update pricing for their org",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT orgs.id\n   FROM orgs\n  WHERE (orgs.id = ((auth.jwt() ->> 'org_id'::text))::uuid)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pricing",
    "policyname": "Users can view pricing for their org",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT orgs.id\n   FROM orgs\n  WHERE (orgs.id = ((auth.jwt() ->> 'org_id'::text))::uuid)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_insert_own",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_read_own",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_update_own",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "responsibilities",
    "policyname": "Allow read responsibilities for active or locked orgs",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "responsibilities",
    "policyname": "Block changes to responsibilities for locked orgs",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "responsibilities",
    "policyname": "Org members can modify org responsibilities",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = responsibilities.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "responsibilities",
    "policyname": "Org members can read org responsibilities",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = responsibilities.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "rooms",
    "policyname": "authenticated_full_access_rooms",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.org_id = rooms.org_id))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.org_id = rooms.org_id))))"
  },
  {
    "schemaname": "public",
    "tablename": "special_dates",
    "policyname": "Enable all for authenticated users on special_dates",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": "(auth.role() = 'authenticated'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "staff_notes",
    "policyname": "Allow read staff_notes for active or locked orgs",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "staff_notes",
    "policyname": "Block changes to staff_notes for locked orgs",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "staff_notes",
    "policyname": "Org members can modify org staff_notes",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = staff_notes.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "staff_notes",
    "policyname": "Org members can read org staff_notes",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = staff_notes.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "Users can view subscription for their organization",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.org_id = subscriptions.org_id) AND (profiles.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "allow_select_subscriptions",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "delete_own_org",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "delete_subscriptions_admin_only",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "insert_own_org",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((org_id IS NULL) OR (org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "insert_subscriptions_admin_only",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))"
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "read_subscriptions_admin_only",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "select_own_org",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "update_own_org",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "update_subscriptions_admin_only",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))"
  },
  {
    "schemaname": "public",
    "tablename": "trigger_execution_log",
    "policyname": "Authenticated users can view trigger logs from their org",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "trigger_execution_log",
    "policyname": "Service role can manage trigger logs",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  }
]