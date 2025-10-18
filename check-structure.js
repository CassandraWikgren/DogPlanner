// check-structure.js
// 🐾 DogPlanner - Strukturkontroll och feldiagnostik
// Kör: npm run check-structure

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.cwd();

console.log("🔍 DOGPLANNER - SYSTEMDIAGNOSTIK");
console.log("=".repeat(50));

// Kontrollera Next.js kompileringsfel
function checkBuildErrors() {
  console.log("\n📊 KONTROLLERAR TYPESCRIPT/NEXT.JS FEL:");
  try {
    execSync("npx tsc --noEmit", { stdio: "pipe", cwd: root });
    console.log("✅ Inga TypeScript-fel hittades");
  } catch (error) {
    console.log("❌ TypeScript-fel hittades:");
    console.log(error.stdout.toString());
  }
}

// Kontrollera viktiga sidor
function checkCriticalPages() {
  console.log("\n🏠 KONTROLLERAR VIKTIGA SIDOR:");

  const criticalPages = [
    { path: "app/page.tsx", name: "Startsida", errorCode: "HOME_001" },
    { path: "app/login/page.tsx", name: "Inloggning", errorCode: "AUTH_001" },
    {
      path: "app/rooms/page.tsx",
      name: "Rumhantering",
      errorCode: "ROOMS_001",
    },
    {
      path: "app/dashboard/page.tsx",
      name: "Dashboard",
      errorCode: "DASH_001",
    },
    {
      path: "app/hunddagis/page.tsx",
      name: "Hunddagis",
      errorCode: "DAYCARE_001",
    },
    {
      path: "app/hundpensionat/page.tsx",
      name: "Hundpensionat",
      errorCode: "BOARDING_001",
    },
  ];

  criticalPages.forEach((page) => {
    const fullPath = path.join(root, page.path);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${page.name} (${page.errorCode}): OK`);
    } else {
      console.log(`❌ ${page.name} (${page.errorCode}): SAKNAS`);
    }
  });
}

// Kontrollera kärnkomponenter
function checkCoreComponents() {
  console.log("\n🧩 KONTROLLERAR KÄRNKOMPONENTER:");

  const coreComponents = [
    {
      path: "lib/roomCalculator.ts",
      name: "Rumberäkningar",
      errorCode: "CALC_001",
    },
    { path: "lib/supabase.ts", name: "Databas", errorCode: "DB_001" },
    { path: "middleware.ts", name: "Middleware", errorCode: "MIDDLEWARE_001" },
    {
      path: "components/ui/card.tsx",
      name: "UI-komponenter",
      errorCode: "UI_001",
    },
  ];

  coreComponents.forEach((comp) => {
    const fullPath = path.join(root, comp.path);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${comp.name} (${comp.errorCode}): OK`);
    } else {
      console.log(`❌ ${comp.name} (${comp.errorCode}): SAKNAS`);
    }
  });
}

// Kör alla kontroller
function runDiagnostics() {
  checkBuildErrors();
  checkCriticalPages();
  checkCoreComponents();

  console.log("\n🏥 FELKODER GUIDE:");
  console.log("HOME_001: Startsida problem");
  console.log("AUTH_001: Inloggningsproblem");
  console.log("ROOMS_001: Rumhantering problem");
  console.log("DASH_001: Dashboard problem");
  console.log("DAYCARE_001: Hunddagis problem");
  console.log("BOARDING_001: Hundpensionat problem");
  console.log("CALC_001: Beräkningsproblem");
  console.log("DB_001: Databasproblem");
  console.log("MIDDLEWARE_001: Autentiseringsproblem");
  console.log("UI_001: UI-komponentproblem");

  console.log("\n🚀 SNABBKOMMANDON:");
  console.log("npm run dev     - Starta utvecklingsserver");
  console.log("npm run build   - Kontrollera alla fel");
  console.log("npm run lint    - Kontrollera kodkvalitet");
}

runDiagnostics();

// 🚫 Gamla filer som ska bort
const deprecated = [
  "app/dogs",
  "app/dogs/page.tsx",
  "app/dogs/[id]/page.tsx",
  "app/dogs/new/page.tsx",
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
    console.log(
      "🎉 Allt ser perfekt ut! Din DogPlanner-struktur är komplett.\n"
    );
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
