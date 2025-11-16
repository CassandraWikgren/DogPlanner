#!/bin/bash

# Test-script för att byta mellan gammal och ny nybokning-sida
# Kör med: ./test-nybokning.sh old ELLER ./test-nybokning.sh new

if [ "$1" == "new" ]; then
    echo "🔄 Byter till NYA versionen (v2)..."
    cp app/hundpensionat/nybokning/page.tsx app/hundpensionat/nybokning/page_OLD.tsx
    cp app/hundpensionat/nybokning/page_v2.tsx app/hundpensionat/nybokning/page.tsx
    echo "✅ Nu kör du NYA versionen!"
    echo "📝 Gammal version sparad som page_OLD.tsx"
    
elif [ "$1" == "old" ]; then
    echo "🔄 Återgår till GAMLA versionen..."
    if [ -f "app/hundpensionat/nybokning/page_OLD.tsx" ]; then
        cp app/hundpensionat/nybokning/page_OLD.tsx app/hundpensionat/nybokning/page.tsx
        echo "✅ Nu kör du GAMLA versionen!"
    else
        cp app/hundpensionat/nybokning/page.tsx.BACKUP app/hundpensionat/nybokning/page.tsx
        echo "✅ Återställt från BACKUP!"
    fi
    
else
    echo "❌ Användning: ./test-nybokning.sh [new|old]"
    echo ""
    echo "Exempel:"
    echo "  ./test-nybokning.sh new   # Byt till nya versionen"
    echo "  ./test-nybokning.sh old   # Återgå till gamla versionen"
fi
