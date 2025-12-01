#!/bin/bash

# Fix för resterande filer

echo "🔧 Fixar resterande Supabase client deklarationer..."

files=(
    "app/hundpensionat/bokningsformulär/page.tsx"
    "app/frisor/kalender/page.tsx"
    "app/admin/priser/dagis/page.tsx"
    "app/admin/priser/pensionat/page.tsx"
    "app/foretagsinformation/page.tsx"
    "app/consent/verify/page.tsx"
    "app/applications/page.tsx"
    "app/owners/[id]/page.tsx"
    "app/kundrabatter/page.tsx"
    "app/profile-check/page.tsx"
    "app/ansokan/hunddagis/page.tsx"
    "app/ansokan/pensionat/page.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 $file"
        sed -i.bak2 's/import { createClientComponentClient } from "@supabase\/auth-helpers-nextjs";/import { supabase } from "@\/lib\/supabase";/g' "$file"
        sed -i.bak2 '/^  const supabase = createClientComponentClient();$/d' "$file"
        sed -i.bak2 '/^    const supabase = createClientComponentClient();$/d' "$file"
        sed -i.bak2 '/^      const supabase = createClientComponentClient();$/d' "$file"
    fi
done

echo "✅ Klar!"
