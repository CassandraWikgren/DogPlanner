#!/bin/bash
# ============================================================
# TEST: Anropa Supabase REST API direkt med curl
# ============================================================
# Kör detta för att se exakt vad Supabase svarar
# ============================================================

# INSTRUKTION: Ersätt dessa värden med dina riktiga från .env.local
SUPABASE_URL="DIN_SUPABASE_URL_HÄR"
ANON_KEY="DIN_ANON_KEY_HÄR"

echo "🔍 Testar special_dates API..."
curl -X GET \
  "${SUPABASE_URL}/rest/v1/special_dates?select=*&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -v

echo "\n\n🔍 Testar boarding_seasons API..."
curl -X GET \
  "${SUPABASE_URL}/rest/v1/boarding_seasons?select=*&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -v
