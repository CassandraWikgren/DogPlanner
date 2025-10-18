// Test av beräkningarna enligt Jordbruksverkets exempel
console.log("=== TEST AV JORDBRUKSVERKETS EXEMPEL ===");
console.log("Tre hundar: 30cm, 40cm, 50cm mankhöjd");
console.log("");

// Simulera beräkningen manuellt
console.log("Manuell beräkning enligt Jordbruksverket:");
console.log("1. Börja med största hunden (50cm)");
console.log("   - 50cm faller under kategorin 46-55cm");
console.log("   - Grundyta: 3,5m²");
console.log("");
console.log("2. Lägg till första extra hunden (40cm)");
console.log("   - 40cm faller under kategorin 36-45cm");
console.log("   - Tillägg: +1,5m²");
console.log("");
console.log("3. Lägg till andra extra hunden (30cm)");
console.log("   - 30cm faller under kategorin 25-35cm");
console.log("   - Tillägg: +1,5m²");
console.log("");
console.log("Total yta: 3,5 + 1,5 + 1,5 = 6,5m²");
console.log("");

// Test av olika enskilda hundars krav
console.log("=== TEST AV ENSKILDA HUNDAR ===");
const singleDogTests = [
  { height: 20, expected: 2, category: "under 25cm" },
  { height: 30, expected: 2, category: "25-35cm" },
  { height: 40, expected: 2.5, category: "36-45cm" },
  { height: 50, expected: 3.5, category: "46-55cm" },
  { height: 60, expected: 4.5, category: "56-65cm" },
  { height: 70, expected: 5.5, category: "över 65cm" },
];

singleDogTests.forEach((test) => {
  console.log(`Hund ${test.height}cm (${test.category}): ${test.expected}m²`);
});
