#!/bin/bash
# ============================================================
# UPDATE SCHEMA FROM SUPABASE
# ============================================================
# Kör detta script när du vill uppdatera schema.sql från deployed databas
# Usage: ./update-schema.sh
# ============================================================

echo "🔄 Uppdaterar schema från Supabase..."

# Kolla om supabase CLI finns
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI är inte installerat"
    echo "Installera med: brew install supabase/tap/supabase"
    exit 1
fi

# Kolla om config finns (antingen .supabase eller supabase)
if [ ! -f ".supabase/config.toml" ] && [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  Supabase config saknas"
    echo "Kör först: supabase init"
    exit 1
fi

# Exportera schema
echo "📥 Exporterar schema från deployed databas..."
supabase db pull

if [ $? -eq 0 ]; then
    echo "✅ Schema uppdaterat!"
    echo "📁 Kolla supabase/schema.sql för det nya schemat"
    
    # Visa vad som ändrades
    if command -v git &> /dev/null; then
        echo ""
        echo "📊 Ändringar:"
        git diff --stat supabase/schema.sql
    fi
else
    echo "❌ Fel vid export av schema"
    exit 1
fi
