#!/usr/bin/env python3
"""
Migrera återstående filer som använder gamla lib/supabase.ts till nya @supabase/ssr
"""

import re
import sys
from pathlib import Path

# Filer att migrera
FILES_TO_MIGRATE = [
    "app/frisor/page.tsx",
    "app/admin/hundfrisor/priser/page.tsx",
    "app/register/page.tsx",
    "lib/store.ts",
    "lib/emailConfig.ts",
    "components/StaffNotes.tsx",
    "components/DashboardHeader.tsx",
    "components/SupabaseListner.tsx",
    "components/DagisStats.tsx",
    "components/InterestApplicationModal.tsx",
    "components/StaffResponsibility.tsx",
    "components/WaitlistView.tsx",
    "app/login/page.tsx",
    "app/auth-debug/page.tsx",
    "app/ansokan/page.tsx",
    "app/pricing/page.tsx",
    "app/kundportal/mina-bokningar/page.tsx",
    "app/rooms/overview/page.tsx",
    "app/kundportal/ny-bokning/page.tsx",
    "app/kundportal/mina-hundar/page.tsx",
    "app/rooms/page.tsx",
    "app/reset-password/page.tsx",
    "app/owners/page.tsx",
    "app/organisation/page.tsx",
    "app/dashboard/staff/page.tsx",
    "app/subscription/page.tsx",
    "app/admin/loggar/page.tsx",
    "app/admin/priser/page.tsx",
    "app/admin/rum/page.tsx",
    "app/diagnostik/page.tsx",
    "app/frisor/[dogId]/page.tsx",
    "app/hundpensionat/[id]/page.tsx",
    "app/hundpensionat/page.tsx",
    "app/hundpensionat/schema/page.tsx",
    "app/hundpensionat/nybokning/page.tsx",
    "app/hundpensionat/priser/page.tsx",
    "app/hundpensionat/tillval/page.tsx",
    "app/hundpensionat/kalender/page.tsx",
    "app/hunddagis/page.tsx",
    "app/hunddagis/dagens-schema/page.tsx",
]

def migrate_file(file_path: Path):
    """Migrera en enskild fil"""
    
    if not file_path.exists():
        print(f"⏭️  Hoppar över {file_path} (finns inte)")
        return False
    
    print(f"🔄 Migrerar {file_path}")
    
    content = file_path.read_text()
    original_content = content
    
    # 1. Byt ut import statement
    old_imports = [
        r'import\s*\{\s*supabase\s*\}\s*from\s*["\']@/lib/supabase["\'];?',
        r'import\s*\{\s*supabase\s+as\s+supabaseClient\s*\}\s*from\s*["\']@/lib/supabase["\'];?',
    ]
    
    new_import = 'import { createClient } from "@/lib/supabase/client";'
    
    for old_import_pattern in old_imports:
        if re.search(old_import_pattern, content):
            content = re.sub(old_import_pattern, new_import, content)
            break
    
    # 2. Hitta alla async funktioner och lägg till const supabase = createClient()
    # Mönster: const functionName = async (...) => {
    async_arrow_pattern = r'(const\s+\w+\s*=\s*async\s*\([^)]*\)\s*=>\s*\{)'
    
    def add_supabase_client(match):
        func_declaration = match.group(1)
        # Kolla om redan har createClient() i funktionen
        return func_declaration + '\n    const supabase = createClient();'
    
    # Vi kan inte enkelt detektera om createClient() redan finns, så vi gör det manuellt
    # För nu, byt bara imports
    
    if content != original_content:
        file_path.write_text(content)
        print(f"✅ Migrerade {file_path}")
        return True
    else:
        print(f"⏭️  Ingen ändring behövdes för {file_path}")
        return False

def main():
    base_dir = Path(__file__).parent
    migrated = 0
    skipped = 0
    
    for file_rel_path in FILES_TO_MIGRATE:
        file_path = base_dir / file_rel_path
        if migrate_file(file_path):
            migrated += 1
        else:
            skipped += 1
    
    print(f"\n✅ Klart! {migrated} filer migrerade, {skipped} hoppade över")
    print(f"\n⚠️  OBS: Du behöver manuellt lägga till 'const supabase = createClient()' i async funktioner!")

if __name__ == "__main__":
    main()
