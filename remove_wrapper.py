#!/usr/bin/env python3
"""
Ta bort den stora wrapper-diven från nybokning page_v2.tsx
Behåller all annan struktur intakt
"""

file_path = "app/hundpensionat/nybokning/page_v2.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_next_close = False
wrapper_removed = False

for i, line in enumerate(lines):
    # Rad 368 (index 367): Ta bort öppnande wrapper-div
    if i == 367 and '<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">' in line:
        # Skip denna rad helt
        wrapper_removed = True
        continue
    
    # Rad 827 (index 826): Ta bort stängande wrapper-div
    if i == 826 and wrapper_removed and line.strip() == '</div>':
        # Skip denna rad helt
        continue
    
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Tog bort wrapper-div från page_v2.tsx")
print(f"✅ Totalt {len(lines)} rader → {len(new_lines)} rader")
print(f"✅ Borttagna rader: {len(lines) - len(new_lines)}")
