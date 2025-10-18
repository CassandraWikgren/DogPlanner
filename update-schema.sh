#!/bin/bash
# update-schema.sh
# Script för att uppdatera schema.sql från Supabase

echo "🔄 Uppdaterar schema från Supabase..."

# Kontrollera om supabase CLI är länkat
if ! supabase projects list &> /dev/null; then
    echo "❌ Supabase CLI är inte länkat till ett projekt."
    echo "💡 Gör så här:"
    echo "   1. Gå till https://app.supabase.com/project/[ditt-projekt]/settings/api"
    echo "   2. Kopiera Project Reference ID"
    echo "   3. Kör: supabase link --project-ref [din-project-ref]"
    exit 1
fi

# Skapa backup av nuvarande schema
if [ -f "supabase/schema.sql" ]; then
    cp supabase/schema.sql supabase/schema.sql.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup skapad av nuvarande schema"
fi

# Exportera nytt schema
echo "📥 Exporterar schema från Supabase..."
supabase db dump --schema=public --data-only=false > supabase/schema_new.sql

if [ $? -eq 0 ]; then
    mv supabase/schema_new.sql supabase/schema.sql
    echo "✅ Schema uppdaterat!"
    echo "📊 Kontrollera skillnader med: git diff supabase/schema.sql"
else
    echo "❌ Fel vid export"
fi