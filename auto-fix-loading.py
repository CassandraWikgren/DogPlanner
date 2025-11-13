#!/usr/bin/env python3
"""
Automatisk fix av loading-bugs i alla filer.
Lägger till else-case i useEffect för att sätta loading=false när currentOrgId saknas.
"""

import re
import sys

FILES_TO_FIX = [
    "app/hunddagis/page.tsx",
    "app/hunddagis/dagens-schema/page.tsx",
    "app/hunddagis/priser/page.tsx",
    "app/hunddagis/intresseanmalningar/page.tsx",
    "app/hundpensionat/tillval/page.tsx",
    "app/hundpensionat/kalender/page.tsx",
    "app/hundpensionat/ansokningar/page.tsx",
    "app/hundpensionat/priser/page.tsx",
    "app/hundpensionat/new/page.tsx",
    "app/frisor/ny-bokning/page.tsx",
    "app/frisor/page.tsx",
    "app/foretagsinformation/page.tsx",
    "app/applications/page.tsx",
    "app/owners/page.tsx",
    "app/rooms/page.tsx",
]

def fix_file(filepath):
    """Fix useEffect pattern in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match useEffect with currentOrgId check without else
        # This matches: useEffect(() => {\n    if (currentOrgId) {\n      <something>();\n    }\n  }, [currentOrgId]);
        pattern = r'(useEffect\(\(\) => \{\s+if \(currentOrgId\) \{\s+\w+\(\);?\s+\})\s+(\}, \[currentOrgId\]\);)'
        
        replacement = r'\1 else {\n      setLoading(false);\n    }\n  \2'
        
        new_content, count = re.subn(pattern, replacement, content)
        
        if count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Fixed: {filepath} ({count} replacement(s))")
            return True
        else:
            print(f"⚠️  No pattern found in: {filepath}")
            return False
            
    except FileNotFoundError:
        print(f"❌ File not found: {filepath}")
        return False
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    print("🔧 Fixing loading bugs in all files...\n")
    
    fixed_count = 0
    for filepath in FILES_TO_FIX:
        if fix_file(filepath):
            fixed_count += 1
    
    print(f"\n✨ Done! Fixed {fixed_count} out of {len(FILES_TO_FIX)} files")

if __name__ == "__main__":
    main()
