// Test av Jordbruksverkets exakta mått från användarens input
// Kör med: node test-jordbruksverket-calculations.js

const {
  calculateRequiredArea,
  calculateMaxDogsCapacity,
} = require("./lib/roomCalculator.ts");

console.log("=== TESTNING AV JORDBRUKSVERKETS EXAKTA MÅTT ===\n");

// Test 1: Ensam hund enligt tabellen
console.log("TEST 1: Ensam hund");
console.log("----------------");

const testCases = [
  { height: 20, expected: 2, category: "<25cm" },
  { height: 30, expected: 2, category: "25-35cm" },
  { height: 40, expected: 2.5, category: "36-45cm" },
  { height: 50, expected: 3.5, category: "46-55cm" },
  { height: 60, expected: 4.5, category: "56-65cm" },
  { height: 70, expected: 5.5, category: ">65cm" },
];

testCases.forEach((test) => {
  const dog = { id: "1", name: "Test", height_cm: test.height };
  const result = calculateRequiredArea([dog]);
  const status = result === test.expected ? "✅" : "❌";
  console.log(
    `${status} ${test.category} (${test.height}cm): ${result}m² (förväntat: ${test.expected}m²)`
  );
});

// Test 2: Exempel från Jordbruksverket
console.log("\nTEST 2: Jordbruksverkets exempel");
console.log("--------------------------------");
console.log("Tre hundar: 30cm, 40cm, 50cm mankhöjd");

const dogs = [
  { id: "1", name: "Hund1", height_cm: 30 },
  { id: "2", name: "Hund2", height_cm: 40 },
  { id: "3", name: "Hund3", height_cm: 50 },
];

const result = calculateRequiredArea(dogs);
console.log(`Beräknat resultat: ${result}m²`);
console.log("Manuell beräkning:");
console.log("- Största hunden (50cm): 3,5m² grundyta");
console.log("- Första extra hunden (40cm): +1,5m²");
console.log("- Andra extra hunden (30cm): +1,5m²");
console.log("- Total: 3,5 + 1,5 + 1,5 = 6,5m²");
console.log(`Status: ${result === 6.5 ? "✅ KORREKT" : "❌ FEL"}`);

// Test 3: Kapacitetsberäkningar
console.log("\nTEST 3: Kapacitetsberäkningar");
console.log("-----------------------------");

const room_sizes = [10, 20, 30];

room_sizes.forEach((size) => {
  console.log(`\nRum med ${size}m²:`);
  const capacity = calculateMaxDogsCapacity(size);
  console.log(
    `- Max mycket små hundar (<25cm): ${capacity.max_very_small_dogs}`
  );
  console.log(`- Max små hundar (25-35cm): ${capacity.max_small_dogs}`);
  console.log(
    `- Max små-medel hundar (36-45cm): ${capacity.max_small_medium_dogs}`
  );
  console.log(`- Max medelstora hundar (46-55cm): ${capacity.max_medium_dogs}`);
  console.log(
    `- Max medel-stora hundar (56-65cm): ${capacity.max_medium_large_dogs}`
  );
  console.log(`- Max stora hundar (>65cm): ${capacity.max_large_dogs}`);
});

console.log("\n=== TESTNING SLUTFÖRD ===");
