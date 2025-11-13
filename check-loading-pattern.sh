#!/bin/bash
# Kollar alla sidor som använder currentOrgId och loading för potentiella infinite loading bugs

echo "=== Kollar sidor med currentOrgId och loading patterns ==="
echo ""

for file in $(find app -name "page.tsx" -type f); do
  # Kolla om filen har både currentOrgId och loading state
  has_org_id=$(grep -l "currentOrgId" "$file" 2>/dev/null)
  has_loading=$(grep -l "const \[loading" "$file" 2>/dev/null)
  
  if [ -n "$has_org_id" ] && [ -n "$has_loading" ]; then
    # Kolla om useEffect har else-case för när currentOrgId saknas
    has_else_case=$(grep -A 5 "if (currentOrgId)" "$file" | grep -c "} else {")
    
    echo "📄 $file"
    
    if [ "$has_else_case" -eq 0 ]; then
      echo "   ⚠️  SAKNAR else-case i useEffect - kan fastna i loading!"
    else
      echo "   ✅ Har else-case - OK"
    fi
    
    # Kolla om det finns !currentOrgId check efter loading
    has_org_check=$(grep -c "if (!currentOrgId)" "$file")
    if [ "$has_org_check" -gt 0 ]; then
      echo "   ✅ Har !currentOrgId check"
    else
      echo "   ⚠️  Saknar !currentOrgId check efter loading"
    fi
    
    echo ""
  fi
done

echo "=== Kontroll klar ==="
