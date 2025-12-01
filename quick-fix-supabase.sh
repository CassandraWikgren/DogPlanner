#!/bin/bash

# Automatisk fix av kritiska filer - tar bort lokala supabase deklarationer

echo "🔧 Fixar kritiska Supabase client deklarationer..."

# Lista över filer att fixa (prioriterade)
files=(
    "app/kundportal/boka/page.tsx"
    "app/kundportal/login/page.tsx"
    "app/kundportal/registrera/page.tsx"
    "app/hunddagis/[id]/page.tsx"
    "app/hunddagis/priser/page.tsx"
    "app/hunddagis/intresseanmalningar/page.tsx"
    "app/hundpensionat/ansokningar/page.tsx"
    "app/hundpensionat/aktiva-gaster/page.tsx"
    "app/admin/abonnemang/page.tsx"
    "app/admin/tjanster/page.tsx"
    "app/admin/users/page.tsx"
    "app/admin/rapporter/page.tsx"
    "app/frisor/ny-bokning/page.tsx"
    "app/ekonomi/page.tsx"
    "app/faktura/page.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Bearbetar: $file"
        
        # Ersätt import
        sed -i.bak 's/import { createClientComponentClient } from "@supabase\/auth-helpers-nextjs";/import { supabase } from "@\/lib\/supabase";/g' "$file"
        
        # Ta bort lokala const supabase = createClientComponentClient(); (olika varianter)
        sed -i.bak '/^  const supabase = createClientComponentClient();$/d' "$file"
        sed -i.bak '/^    const supabase = createClientComponentClient();$/d' "$file"
        sed -i.bak '/^      const supabase = createClientComponentClient();$/d' "$file"
        
        echo "  ✅ Klar"
    else
        echo "  ⚠️  Fil saknas: $file"
    fi
done

echo ""
echo "✅ Fixade ${#files[@]} filer"
echo "📁 Backups skapade med .bak extension"
echo ""
echo "Testa nu applikationen och kör sedan:"
echo "  find app/ -name '*.bak' -delete"
