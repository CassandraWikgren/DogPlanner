// check-structure.js
// 🐾 DogPlanner - Strukturkontroll och städverktyg
// Kör: npm run check-structure

const fs = require("fs");
const path = require("path");

const root = process.cwd();

// 📋 Lista på viktiga filer och mappar
const required = [
  "app/layout.tsx",
  "app/dashboard/page.tsx",
  "app/hunddagis/page.tsx",
  "app/hunddagis/[id]/page.tsx",
  "app/hunddagis/new/page.tsx",
  "app/hundpensionat/page.tsx",
  "app/foretagsinformation/page.tsx",
  "app/invoices/page.tsx",
  "app/pricing/page.tsx",
  "app/rooms/page.tsx",
  "app/subscription/page.tsx",
  "lib/store.ts",
  "context/AuthContext.tsx",
  "globals.css",
  "tailwind.config.js",
  "package.json"
];

// 🚫 Gamla filer som ska bort
const deprecated = [
  "app/dogs",
  "app/dogs/page.tsx",
  "app/dogs/[id]/page.tsx",
  "app/dogs/new/page.tsx"
];

// 🧠 Hjälpfunktioner
function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function checkPaths() {
  console.log("\n🔍 Kontrollerar DogPlanner-struktur...\n");

  let missing = [];
  let oldFiles = [];

  // ✅ Kolla att rätt filer finns
  for (const rel of required) {
    if (!exists(rel)) {
      console.log(`❌ Saknas: ${rel}`);
      missing.push(rel);
    } else {
      console.log(`✅ ${rel}`);
    }
  }

  console.log("\n🧹 Letar efter gamla filer...\n");

  // ⚠️ Kolla om gamla filer finns kvar
  for (const rel of deprecated) {
    if (exists(rel)) {
      console.log(`⚠️  Bör tas bort: ${rel}`);
      oldFiles.push(rel);
    }
  }

  // 📊 Sammanfattning
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (missing.length === 0 && oldFiles.length === 0) {
    console.log("🎉 Allt ser perfekt ut! Din DogPlanner-struktur är komplett.\n");
  } else {
    if (missing.length > 0) {
      console.log(`🚨 Saknade filer (${missing.length}):`);
      missing.forEach((m) => console.log("  • " + m));
    }
    if (oldFiles.length > 0) {
      console.log(`🧹 Gamla filer att ta bort (${oldFiles.length}):`);
      oldFiles.forEach((m) => console.log("  • " + m));
    }
    console.log("\n⚠️  Kontrollera listan ovan innan du fortsätter.\n");
  }
}

// 🚀 Kör
checkPaths();
