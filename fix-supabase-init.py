#!/usr/bin/env python3
"""
Script för att automatiskt lägga till const supabase = createClient() i alla filer som importerar men inte använder det.
"""

import os
import re
from pathlib import Path

def find_tsx_files_with_import(root_dir):
    """Hitta alla .tsx/.ts filer som importerar createClient"""
    files = []
    for path in Path(root_dir).rglob("*.tsx"):
        if 'node_modules' in str(path) or '.next' in str(path):
            continue
        try:
            content = path.read_text(encoding='utf-8')
            if "from '@/lib/supabase/client'" in content or 'from "@/lib/supabase/client"' in content:
                files.append(path)
        except Exception as e:
            print(f"Kunde inte läsa {path}: {e}")
    return files

def check_and_fix_file(file_path):
    """Kontrollera om filen saknar supabase-initiering och fixa det"""
    try:
        content = file_path.read_text(encoding='utf-8')
        
        # Kolla om filen redan har const supabase = createClient()
        if 'const supabase = createClient()' in content or 'const supabase=createClient()' in content:
            return False, "Har redan supabase init"
        
        # Hitta export default function
        export_match = re.search(r'export default function\s+(\w+)\s*\([^)]*\)\s*\{', content)
        if not export_match:
            return False, "Ingen export default function hittad"
        
        # Hitta funktionens start
        func_start = export_match.end()
        
        # Leta efter första raden efter { (kan vara whitespace)
        lines = content[:func_start].split('\n')
        insert_line = len(lines)
        
        # Sätt in const supabase = createClient(); som första rad i funktionen
        lines_after = content[func_start:].split('\n')
        
        # Hitta indenteringen från nästa rad
        indent = '  '  # Default 2 spaces
        for line in lines_after[:5]:
            if line.strip() and not line.strip().startswith('//'):
                # Räkna spaces i början
                spaces = len(line) - len(line.lstrip())
                indent = ' ' * spaces
                break
        
        # Sätt in raden
        new_content = content[:func_start] + f"\n{indent}const supabase = createClient();" + content[func_start:]
        
        file_path.write_text(new_content, encoding='utf-8')
        return True, "Supabase init tillagd"
        
    except Exception as e:
        return False, f"Fel: {e}"

def main():
    root_dir = "/Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031"
    
    print("🔍 Söker efter filer som importerar createClient...")
    files = find_tsx_files_with_import(root_dir)
    print(f"✅ Hittade {len(files)} filer\n")
    
    fixed = 0
    skipped = 0
    
    for file_path in files:
        rel_path = file_path.relative_to(root_dir)
        success, message = check_and_fix_file(file_path)
        
        if success:
            print(f"✅ {rel_path}: {message}")
            fixed += 1
        else:
            print(f"⏭️  {rel_path}: {message}")
            skipped += 1
    
    print(f"\n📊 Resultat:")
    print(f"  Fixade: {fixed}")
    print(f"  Hoppade över: {skipped}")
    print(f"  Totalt: {len(files)}")

if __name__ == "__main__":
    main()
