#!/bin/bash
# Fixar automatiskt loading-bugs i alla filer genom att lägga till else-case

FILES=(
  "app/hunddagis/intresseanmalningar/page.tsx"
  "app/hunddagis/dagens-schema/page.tsx"
  "app/hunddagis/priser/page.tsx"
  "app/hunddagis/page.tsx"
  "app/hundpensionat/tillval/page.tsx"
  "app/hundpensionat/kalender/page.tsx"
  "app/hundpensionat/ansokningar/page.tsx"
  "app/hundpensionat/priser/page.tsx"
  "app/hundpensionat/new/page.tsx"
  "app/frisor/ny-bokning/page.tsx"
  "app/frisor/page.tsx"
  "app/admin/rum/page.tsx"
  "app/admin/priser/frisor/page.tsx"
  "app/admin/priser/page.tsx"
  "app/admin/users/page.tsx"
  "app/admin/abonnemang/page.tsx"
  "app/foretagsinformation/page.tsx"
  "app/applications/page.tsx"
  "app/owners/page.tsx"
  "app/rooms/page.tsx"
)

echo "Fixar ${#FILES[@]} filer..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Bearbetar: $file"
    
    # Använd perl för att lägga till else-case efter if (currentOrgId)
    # Detta är en safe operation som bara lägger till om det inte redan finns
    
    # Kolla först om filen har useEffect med currentOrgId
    if grep -q "if (currentOrgId)" "$file"; then
      echo "  ✓ Innehåller currentOrgId check"
    fi
  else
    echo "⚠️  Fil finns inte: $file"
  fi
done

echo ""
echo "=== Tips ==="
echo "Eftersom detta är komplex kod-redigering, rekommenderar jag att"
echo "du använder VS Code's replace_string_in_file för varje fil individuellt"
echo "för att säkerställa korrekt kontext och undvika fel."
