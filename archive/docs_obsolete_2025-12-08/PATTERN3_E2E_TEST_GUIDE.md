# Pattern 3 - Manual End-to-End Test Guide

**Test Date:** 5 December 2025  
**Status:** Ready for Testing

---

## ✅ Pre-Test Verification

### Database Checks

Run these queries in Supabase SQL Editor:

```sql
-- Verify applications table exists
SELECT COUNT(*) as app_count FROM applications;

-- Verify applications is empty
SELECT * FROM applications LIMIT 5;

-- Verify owners.org_id is nullable
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'owners' AND column_name = 'org_id';
-- Should return: is_nullable = YES

-- Verify RLS policies are active
SELECT tablename, policyname, cmd as operation, roles
FROM pg_policies
WHERE tablename IN ('owners', 'dogs', 'applications')
  AND schemaname = 'public'
ORDER BY tablename, policyname;
-- Should show 15 policies: 4 owners, 4 dogs, 4 applications, 3 legacy dogs
-- ✅ VERIFIED 5 Dec 2025: 15 policies confirmed active
```

---

## 🧪 Test Scenario 1: Hundsägare Registration

**Goal:** Verify that hundsägare can register without selecting an organisation

### Steps:

1. **Navigate to registration**
   - URL: `http://localhost:3000/kundportal/registrera`
   - ✅ Page loads without errors

2. **Fill registration form**
   - Förnamn: "Test"
   - Efternamn: "Owner"
   - Personnummer: "1990-01-01-1234"
   - E-postadress: "testowner@example.com"
   - Telefon: "0701234567"
   - Adress: "Testigatan 1"
   - Postnummer: "12345"
   - Stad: "Stockholm"
   - Lösenord: "TestPassword123!"
   - ✅ NO organisation selector (just like before)

3. **Fill contact person (optional)**
   - Can skip or fill

4. **Fill dog details**
   - Hundnamn: "Fluffy"
   - Ras: "Labrador"
   - Födelsedag: "2020-01-01"
   - Kön: "Hane"
   - Mankhöjd: "60"

5. **Check consent boxes**
   - ✅ Check GDPR & accept terms

6. **Submit registration**
   - Click "Registrera"
   - ✅ Expect: "Registrering lyckades!"
   - ✅ Expect: Redirected to `/kundportal/soka-hunddagis` (NOT login page)

### Database Verification:

```sql
-- Should have new row
SELECT id, full_name, email, org_id
FROM owners
WHERE email = 'testowner@example.com';
-- SHOULD SHOW: org_id = NULL (critical!)

SELECT id, name, owner_id, org_id
FROM dogs
WHERE name = 'Fluffy';
-- SHOULD SHOW: org_id = NULL
```

---

## 🧪 Test Scenario 2: Browse Organisations

**Goal:** Verify hundsägare can see and search organisations

### Steps:

1. **After registration redirect**
   - Should be at `/kundportal/soka-hunddagis`
   - ✅ Page loads
   - ✅ See "Sök hunddagisar" header

2. **See organisations**
   - ✅ Should see list of organisations (cards)
   - ✅ Each card shows: Name, Address, Phone, Email
   - ✅ "Ansök om plats"-knapp on each card

3. **Search functionality**
   - Type organisation name in search box
   - ✅ Results filter in real-time

4. **Error handling**
   - If no dogs registered: should show error "Du måste registrera en hund först"
   - ✅ But we have a dog (Fluffy), so button should be enabled

---

## 🧪 Test Scenario 3: Apply for Place

**Goal:** Verify application is created in database

### Steps:

1. **Click "Ansök om plats"**
   - ✅ Button shows loading state
   - ✅ Success message: "✅ Ansökan skickad till [org name]!"
   - ✅ User might be redirected to dashboard or applications list

2. **Database verification:**

```sql
-- Should have new application
SELECT id, org_id, owner_id, dog_id, status, applied_at
FROM applications
WHERE owner_id = (SELECT id FROM owners WHERE email = 'testowner@example.com');
-- SHOULD SHOW: status = 'pending', applied_at = now()

-- Verify relationship chain
SELECT
  a.id as app_id,
  a.status,
  o.full_name,
  d.name as dog_name,
  org.name as org_name
FROM applications a
JOIN owners o ON a.owner_id = o.id
JOIN dogs d ON a.dog_id = d.id
JOIN orgs org ON a.org_id = org.id
WHERE o.email = 'testowner@example.com';
```

---

## 🧪 Test Scenario 4: Organisation Reviews Applications

**Goal:** Verify organisation can see and manage applications

### Steps:

1. **Login as organisation staff**
   - Go to `http://localhost:3000/kundportal/login`
   - Use organisation staff credentials (or create test org account)
   - ✅ Login successful

2. **Navigate to applications**
   - Go to `http://localhost:3000/hunddagis/applications`
   - ✅ Page loads
   - ✅ See "Hunddagis-ansökningar" header

3. **See pending application**
   - Click "Väntande (1)" tab
   - ✅ Should see card with:
     - Owner name: "Test Owner"
     - Dog name: "Fluffy"
     - Dog breed: "Labrador"
     - Owner email (clickable)
     - Owner phone (clickable)

4. **Approve application**
   - Click "Godkänn"-knapp
   - ✅ Button shows loading state
   - ✅ Success message: "✅ Ansökan godkänd! Test Owner och Fluffy är nu kopplade till er organisation."
   - ✅ Application moves to "Godkända (1)" tab

### Database Verification - CRITICAL:

```sql
-- Verify org_id was assigned
SELECT id, full_name, email, org_id
FROM owners
WHERE email = 'testowner@example.com';
-- SHOULD SHOW: org_id = [not NULL, set to organisation ID]

SELECT id, name, owner_id, org_id
FROM dogs
WHERE name = 'Fluffy';
-- SHOULD SHOW: org_id = [same as owner org_id]

SELECT status, responded_at, response_notes
FROM applications
WHERE owner_id = (SELECT id FROM owners WHERE email = 'testowner@example.com');
-- SHOULD SHOW: status = 'approved', responded_at = now()
```

---

## 🧪 Test Scenario 5: Rejection Workflow

**Goal:** Verify rejection with notes works

### Steps:

1. **Create another application** (repeat scenarios 1-3 with different email)
   - Register: "testowner2@example.com"
   - Apply for different organisation

2. **Login as different org**
   - Go to `/hunddagis/applications`
   - See new pending application

3. **Reject application**
   - Click "Avslå"-knapp
   - ✅ Form appears for rejection reason
   - Type: "Hunden verkar inte passa in i vår miljö"
   - Click "Bekräfta avslag"
   - ✅ Success message
   - ✅ Application moves to "Avslagn" tab

4. **Database verification:**

```sql
SELECT status, response_notes, responded_at
FROM applications
WHERE owner_id = (SELECT id FROM owners WHERE email = 'testowner2@example.com');
-- SHOULD SHOW: status = 'rejected', response_notes = "Hunden verkar..."

-- IMPORTANT: org_id should NOT be assigned for rejected applications
SELECT org_id
FROM owners
WHERE email = 'testowner2@example.com';
-- SHOULD SHOW: org_id = NULL (still no organisation assigned)
```

---

## 🧪 Test Scenario 6: RLS Security Verification

**Goal:** Verify RLS policies prevent unauthorized access

### Steps:

1. **Login as hundsägare (testowner@example.com)**
   - ✅ Can see own owner record
   - ✅ Can see own dogs
   - ✅ Can see own applications

2. **Try to access other owner's data** (in browser dev tools)
   - Supabase client: `const { data } = await supabase.from('owners').select().eq('id', 'OTHER_OWNER_ID')`
   - ✅ Should get empty result (RLS blocks it)

3. **Login as different organisation**
   - ✅ Can only see applications for THEIR org_id
   - ✅ Cannot see other org's applications

---

## ✅ Success Criteria Checklist

### Registration Flow

- [ ] Hundsägare registers without org selection
- [ ] owners.org_id = NULL after registration
- [ ] dogs.org_id = NULL after registration
- [ ] Redirected to `/kundportal/soka-hunddagis` after registration

### Browse & Apply

- [ ] Can see all organisations with hunddagis-service
- [ ] Search functionality works
- [ ] "Ansök om plats" creates row in applications table
- [ ] application.status = 'pending' initially

### Organisation Dashboard

- [ ] Can see pending applications
- [ ] Shows correct owner & dog details
- [ ] Can approve applications
- [ ] On approval: owners.org_id is auto-filled
- [ ] On approval: dogs.org_id is auto-filled
- [ ] Application moves to approved tab
- [ ] Can reject with notes
- [ ] Rejected applications don't assign org_id

### RLS Security

- [ ] Hundsägare can only see own data
- [ ] Organisations only see own applications
- [ ] Service role queries work (admin access)

### Database Integrity

- [ ] applications table has correct schema
- [ ] No orphaned records (all FKs valid)
- [ ] org_id assignments are consistent between owners & dogs
- [ ] Status transitions follow state machine

---

## 🐛 Troubleshooting

### Issue: "Ansökningssystemet är inte aktiverat än"

**Cause:** applications table doesn't exist  
**Fix:** Run `20251204_pattern3_global_registration.sql` in Supabase

### Issue: Registration fails with "new row violates RLS policy"

**Cause:** Old RLS policies still active  
**Fix:** Run `20251204_pattern3_rls_policies.sql` in Supabase

### Issue: org_id not assigned after approval

**Cause:** Application endpoint error  
**Fix:** Check browser console for errors, verify org_id is being passed correctly

### Issue: Can't see organisations in browse page

**Cause:** No organisations have enabled_services = hunddagis  
**Fix:** Check orgs table, add "hunddagis" to enabled_services for test org

---

## 📝 Test Report Template

**Tester:** **\*\*\*\***\_**\*\*\*\***  
**Date:** **\*\*\*\***\_**\*\*\*\***  
**Build:** **\*\*\*\***\_**\*\*\*\***

### Results:

- Registration: [ ] PASS [ ] FAIL
- Browse: [ ] PASS [ ] FAIL
- Apply: [ ] PASS [ ] FAIL
- Org Dashboard: [ ] PASS [ ] FAIL
- Approval: [ ] PASS [ ] FAIL
- Rejection: [ ] PASS [ ] FAIL
- RLS Security: [ ] PASS [ ] FAIL
- Database: [ ] PASS [ ] FAIL

### Notes:

```


```

**Overall Status:** [ ] ALL PASS [ ] SOME FAIL [ ] MAJOR ISSUES
