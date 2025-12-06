#!/usr/bin/env python3
"""
Fixar layout för nybokning page_v2.tsx enligt DESIGN_STANDARD_IMPLEMENTATION.md
Ändrar max-w-7xl till max-w-3xl och tar bort den stora wrapper-diven
"""

file_path = "app/hundpensionat/nybokning/page_v2.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Ändra max-w-7xl till max-w-3xl
content = content.replace('max-w-7xl', 'max-w-3xl')

# Ta bort den stora wrapper-diven på rad 368
# Hitta: <div className="max-w-3xl mx-auto px-6 py-6">\n        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
# Ersätt med: <main className="max-w-3xl mx-auto px-6 py-6">

old_main_with_wrapper = '''      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">'''

new_main_without_wrapper = '''      <main className="max-w-3xl mx-auto px-6 py-6">'''

content = content.replace(old_main_with_wrapper, new_main_without_wrapper)

# Ta bort den stängande wrapper-diven innan </div> (sista main-stängningen)
# Hitta de två sista </div> före }  - den första är wrappern, den andra är main/div
old_end = '''        </div>
      </div>
    </div>'''

new_end = '''      </main>
    </div>'''

content = content.replace(old_end, new_end)

# Lägg till vit bakgrund på varje sektion
# Ändra alla <div className="mb-8"> till <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
content = content.replace(
    '          {!selectedDog && (\n            <div className="mb-8">',
    '        {!selectedDog && (\n          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">'
)

content = content.replace(
    '          {selectedDog && selectedDogData && (\n            <div className="mb-8">',
    '        {selectedDog && selectedDogData && (\n          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">'
)

# Fixa indenteringen för sektionerna efter att vi tagit bort en wrapper-nivå
# Minska indentering för allt mellan {!selectedDog && och })}
lines = content.split('\n')
new_lines = []
in_section = False
section_depth = 0

for i, line in enumerate(lines):
    # Hitta sektionsstart
    if '{!selectedDog &&' in line or '({selectedDog && selectedDogData &&' in line:
        in_section = True
        section_depth = 0
    
    if in_section:
        # Räkna brackets för att veta när sektionen slutar
        section_depth += line.count('{') - line.count('}')
        
        # Minska indentering med 2 spaces (en nivå) om vi är i en sektion
        if line.startswith('          ') and section_depth > 0:
            line = line[2:]  # Ta bort 2 spaces
        elif line.startswith('            ') and section_depth > 0:
            line = line[2:]  # Ta bort 2 spaces
        
        if section_depth <= 0 and (')}' in line or '})' in line):
            in_section = False
    
    new_lines.append(line)

content = '\n'.join(new_lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixat layout i page_v2.tsx")
print("- Ändrat max-w-7xl → max-w-3xl (form-sida)")
print("- Tagit bort stor wrapper-div")
print("- Lagt till vit bakgrund på varje sektion")
print("- Fixat indentering")
