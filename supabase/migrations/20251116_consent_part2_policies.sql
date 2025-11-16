-- GDPR consent logging system - PART 2: Policies
-- Run this after PART 1

CREATE POLICY "Staff can view consent logs for their org" ON consent_logs FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can insert consent logs" ON consent_logs FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Owners can view their own consent logs" ON consent_logs FOR SELECT USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));
