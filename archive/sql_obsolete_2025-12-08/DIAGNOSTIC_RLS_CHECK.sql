-- DIAGNOSTIC: Check all RLS policies that might affect staff login
-- Run this in Supabase SQL Editor

-- 1. Check profiles policies
SELECT 'PROFILES' as table_name, policyname, cmd, qual 
FROM pg_policies WHERE tablename = 'profiles';

-- 2. Check if profiles can be read with current user
SELECT 'profiles_check' as test, count(*) as count FROM profiles;

-- 3. Check dogs policies
SELECT 'DOGS' as table_name, policyname, cmd, qual 
FROM pg_policies WHERE tablename = 'dogs';

-- 4. Check owners policies  
SELECT 'OWNERS' as table_name, policyname, cmd, qual 
FROM pg_policies WHERE tablename = 'owners';

-- 5. Check bookings policies
SELECT 'BOOKINGS' as table_name, policyname, cmd, qual 
FROM pg_policies WHERE tablename = 'bookings';
