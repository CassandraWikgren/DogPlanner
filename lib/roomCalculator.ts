/**
 * Rumbeläggningsberäkningar enligt Jordbruksverkets föreskrifter
 * Baserat på SJVFS 2019:2 - Jordbruksverkets föreskrifter om hundars hållande
 *
 * INOMHUSRUM - EXAKTA MÅTT:
 *
 * Storlek för box eller rum för EN ENSAM hund:
 * < 25 cm mankhöjd: 2 m²
 * 25–35 cm: 2 m²
 * 36–45 cm: 2,5 m²
 * 46–55 cm: 3,5 m²
 * 56–65 cm: 4,5 m²
 * > 65 cm: 5,5 m²
 *
 * Utrymme vid PAR- eller GRUPPHÅLLNING:
 * Grundyta för största hunden + tillägg för varje ytterligare hund enligt hundens egen storlek
 *
 * Grundyta (största hunden):     Tillägg per ytterligare hund:
 * < 25 cm: 2 m²                 < 25 cm: +1 m²
 * 25–35 cm: 2 m²                25–35 cm: +1,5 m²
 * 36–45 cm: 2,5 m²              36–45 cm: +1,5 m²
 * 46–55 cm: 3,5 m²              46–55 cm: +2 m²
 * 56–65 cm: 4,5 m²              56–65 cm: +2,5 m²
 * > 65 cm: 5,5 m²               > 65 cm: +3 m²
 */

export interface Dog {
  id: string;
  name: string;
  height_cm?: number; // mankhöjd
  weight_kg?: number;
  subscription?: string;
  days?: string; // "Måndag,Tisdag,Onsdag"
  checked_in?: boolean;
  room_id?: string;
  owner?: {
    full_name: string;
  } | null;
}

export interface Room {
  id: string;
  name: string;
  capacity_m2: number;
  max_dogs?: number;
  room_type: "daycare" | "boarding" | "both";
}

export interface RoomOccupancy {
  room_id: string;
  room_name: string;
  total_capacity_m2: number;
  required_m2: number;
  available_m2: number;
  occupancy_percentage: number;
  is_overcrowded: boolean;
  is_full: boolean;
  dogs_present: Dog[];
  dogs_count: number;
  max_additional_dogs: number;
  compliance_status: "compliant" | "warning" | "violation";
  compliance_message: string;
}

/**
 * Beräknar erforderlig yta enligt Jordbruksverkets regler för inomhusrum
 * @param dogs Array av hundar som ska vara i rummet
 * @returns Erforderlig yta i kvadratmeter
 */
export function calculateRequiredArea(dogs: Dog[]): number {
  if (dogs.length === 0) return 0;

  if (dogs.length === 1) {
    // Storlek för box eller rum för EN ENSAM hund
    const height = dogs[0].height_cm || 30;

    if (height < 25) {
      return 2; // 2 m²
    } else if (height <= 35) {
      return 2; // 2 m²
    } else if (height <= 45) {
      return 2.5; // 2,5 m²
    } else if (height <= 55) {
      return 3.5; // 3,5 m²
    } else if (height <= 65) {
      return 4.5; // 4,5 m²
    } else {
      return 5.5; // > 65 cm: 5,5 m²
    }
  } else {
    // PAR- eller GRUPPHÅLLNING - flera hundar
    // Börja med grundytan för den största hunden
    const largestDog = dogs.reduce((largest, dog) =>
      (dog.height_cm || 30) > (largest.height_cm || 30) ? dog : largest
    );

    const largestHeight = largestDog.height_cm || 30;
    let baseArea = 0;

    // Grundyta för största hunden
    if (largestHeight < 25) {
      baseArea = 2;
    } else if (largestHeight <= 35) {
      baseArea = 2;
    } else if (largestHeight <= 45) {
      baseArea = 2.5;
    } else if (largestHeight <= 55) {
      baseArea = 3.5;
    } else if (largestHeight <= 65) {
      baseArea = 4.5;
    } else {
      baseArea = 5.5;
    }

    // Lägg till yta för varje ytterligare hund enligt hundens egen storlek
    let additionalArea = 0;
    const otherDogs = dogs.filter((dog) => dog.id !== largestDog.id);

    for (const dog of otherDogs) {
      const height = dog.height_cm || 30;

      if (height < 25) {
        additionalArea += 1; // +1 m²
      } else if (height <= 35) {
        additionalArea += 1.5; // +1,5 m²
      } else if (height <= 45) {
        additionalArea += 1.5; // +1,5 m²
      } else if (height <= 55) {
        additionalArea += 2; // +2 m²
      } else if (height <= 65) {
        additionalArea += 2.5; // +2,5 m²
      } else {
        additionalArea += 3; // > 65 cm: +3 m²
      }
    }

    return baseArea + additionalArea;
  }
}

/**
 * Beräknar maxantal hundar som får plats i ett rum enligt svenska regler
 * @param room_capacity_m2 Rummets kapacitet i kvadratmeter
 * @param existing_dogs Hundar som redan finns i rummet
 * @returns Maxantal hundar som får plats totalt för olika scenarier
 */
export function calculateMaxDogsCapacity(
  room_capacity_m2: number,
  existing_dogs: Dog[] = []
): {
  max_very_small_dogs: number;
  max_small_dogs: number;
  max_small_medium_dogs: number;
  max_medium_dogs: number;
  max_medium_large_dogs: number;
  max_large_dogs: number;
  current_scenario: number;
} {
  // Scenario 1: Endast mycket små hundar (<25 cm)
  // En hund: 2 m², Par/grupp: 2 m² för första + 1 m² för varje tillkommande
  let max_very_small_dogs = 0;
  if (room_capacity_m2 >= 2) {
    max_very_small_dogs = 1 + Math.floor((room_capacity_m2 - 2) / 1);
  }

  // Scenario 2: Endast små hundar (25-35 cm)
  // En hund: 2 m², Par/grupp: 2 m² för första + 1,5 m² för varje tillkommande
  let max_small_dogs = 0;
  if (room_capacity_m2 >= 2) {
    max_small_dogs = 1 + Math.floor((room_capacity_m2 - 2) / 1.5);
  }

  // Scenario 3: Endast små-medel hundar (36-45 cm)
  // En hund: 2,5 m², Par/grupp: 2,5 m² för första + 1,5 m² för varje tillkommande
  let max_small_medium_dogs = 0;
  if (room_capacity_m2 >= 2.5) {
    max_small_medium_dogs = 1 + Math.floor((room_capacity_m2 - 2.5) / 1.5);
  }

  // Scenario 4: Endast medelstora hundar (46-55 cm)
  // En hund: 3,5 m², Par/grupp: 3,5 m² för första + 2 m² för varje tillkommande
  let max_medium_dogs = 0;
  if (room_capacity_m2 >= 3.5) {
    max_medium_dogs = 1 + Math.floor((room_capacity_m2 - 3.5) / 2);
  }

  // Scenario 5: Endast medel-stora hundar (56-65 cm)
  // En hund: 4,5 m², Par/grupp: 4,5 m² för första + 2,5 m² för varje tillkommande
  let max_medium_large_dogs = 0;
  if (room_capacity_m2 >= 4.5) {
    max_medium_large_dogs = 1 + Math.floor((room_capacity_m2 - 4.5) / 2.5);
  }

  // Scenario 6: Endast stora hundar (>65 cm)
  // En hund: 5,5 m², Par/grupp: 5,5 m² för första + 3 m² för varje tillkommande
  let max_large_dogs = 0;
  if (room_capacity_m2 >= 5.5) {
    max_large_dogs = 1 + Math.floor((room_capacity_m2 - 5.5) / 3);
  }

  // Avgör vilket scenario som gäller baserat på befintliga hundar
  let current_scenario = max_large_dogs; // Default till mest restriktiva
  if (existing_dogs.length > 0) {
    const maxHeight = Math.max(
      ...existing_dogs.map((dog) => dog.height_cm || 30)
    );
    if (maxHeight < 25) {
      current_scenario = max_very_small_dogs;
    } else if (maxHeight <= 35) {
      current_scenario = max_small_dogs;
    } else if (maxHeight <= 45) {
      current_scenario = max_small_medium_dogs;
    } else if (maxHeight <= 55) {
      current_scenario = max_medium_dogs;
    } else if (maxHeight <= 65) {
      current_scenario = max_medium_large_dogs;
    } else {
      current_scenario = max_large_dogs;
    }
  }

  return {
    max_very_small_dogs,
    max_small_dogs,
    max_small_medium_dogs,
    max_medium_dogs,
    max_medium_large_dogs,
    max_large_dogs,
    current_scenario,
  };
}

/**
 * Filtrera hundar baserat på vilka dagar de ska vara närvarande
 * @param dogs Array av alla hundar
 * @param targetDay Dag att filtrera för (0=Söndag, 1=Måndag, osv)
 * @returns Hundar som ska vara närvarande den dagen
 */
export function filterDogsByDay(dogs: Dog[], targetDay: number): Dog[] {
  const dayNames = [
    "Söndag",
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lördag",
  ];
  const targetDayName = dayNames[targetDay];

  return dogs.filter((dog) => {
    // Om hunden inte har specificerade dagar, anta att den är närvarande alla dagar
    if (!dog.days) return true;

    // Kontrollera om hundens abonnemang inkluderar den aktuella dagen
    const dogDays = dog.days.split(",").map((day) => day.trim());
    return dogDays.includes(targetDayName);
  });
}

/**
 * Huvudfunktion för att beräkna rumsbeläggning
 * @param room Rummet som ska analyseras
 * @param dogs Hundar som är tilldelade rummet
 * @param targetDay Valfri: dag att beräkna för (default: idag)
 * @returns Komplett beläggningsanalys
 */
export function calculateRoomOccupancy(
  room: Room,
  dogs: Dog[],
  targetDay?: number
): RoomOccupancy {
  // Filtrera hundar för specifik dag om angiven
  const activeDogs =
    targetDay !== undefined
      ? filterDogsByDay(dogs, targetDay)
      : dogs.filter((dog) => dog.checked_in); // Annars använd incheckade hundar

  const required_m2 = calculateRequiredArea(activeDogs);
  const available_m2 = Math.max(0, room.capacity_m2 - required_m2);
  const occupancy_percentage =
    room.capacity_m2 > 0
      ? Math.round((required_m2 / room.capacity_m2) * 100)
      : 0;

  const is_overcrowded = required_m2 > room.capacity_m2;
  const is_full = occupancy_percentage >= 90; // 90% eller mer anses fullt

  // Beräkna hur många hundar till som får plats
  const capacity_info = calculateMaxDogsCapacity(room.capacity_m2, activeDogs);

  // Avgör vilket scenario som gäller baserat på befintliga hundar
  let theoretical_max = capacity_info.current_scenario;
  if (activeDogs.length === 0) {
    // Om inga hundar finns, använd mest optimistiska scenariot (små hundar)
    theoretical_max = capacity_info.max_small_dogs;
  }

  const max_additional_dogs = Math.max(0, theoretical_max - activeDogs.length);

  // Bedöm compliance enligt Jordbruksverkets inomhusregler
  let compliance_status: "compliant" | "warning" | "violation" = "compliant";
  let compliance_message = "Rummet uppfyller Jordbruksverkets inomhuskrav";

  if (is_overcrowded) {
    compliance_status = "violation";
    const hundarText = activeDogs.length === 1 ? "ensam hund" : "grupphållning";
    compliance_message = `Överbeläggning för ${hundarText}! Kräver ${required_m2}m² men har endast ${room.capacity_m2}m²`;
  } else if (occupancy_percentage >= 85) {
    compliance_status = "warning";
    compliance_message = `Nära full kapacitet (${occupancy_percentage}%). Kontrollera att alla hundar trivs enligt § 8.`;
  }

  return {
    room_id: room.id,
    room_name: room.name,
    total_capacity_m2: room.capacity_m2,
    required_m2,
    available_m2,
    occupancy_percentage,
    is_overcrowded,
    is_full,
    dogs_present: activeDogs,
    dogs_count: activeDogs.length,
    max_additional_dogs,
    compliance_status,
    compliance_message,
  };
}

/**
 * Beräkna beläggning för alla rum i en organisation
 * @param rooms Array av rum
 * @param allDogs Array av alla hundar med room_id koppling
 * @param targetDay Valfri: dag att beräkna för
 * @returns Array av beläggningsanalyser
 */
export function calculateAllRoomsOccupancy(
  rooms: Room[],
  allDogs: (Dog & { room_id?: string })[],
  targetDay?: number
): RoomOccupancy[] {
  return rooms.map((room) => {
    const roomDogs = allDogs.filter((dog) => dog.room_id === room.id);
    return calculateRoomOccupancy(room, roomDogs, targetDay);
  });
}

/**
 * Hitta lämpligt rum för en ny hund
 * @param rooms Array av tillgängliga rum
 * @param allDogs Alla befintliga hundar
 * @param newDog Den nya hunden som ska placeras
 * @returns Rekommendationer för rumstilldelning
 */
export function recommendRoomForDog(
  rooms: Room[],
  allDogs: (Dog & { room_id?: string })[],
  newDog: Dog
): Array<{
  room: Room;
  occupancy: RoomOccupancy;
  recommendation_score: number;
  reason: string;
}> {
  const recommendations = rooms.map((room) => {
    const roomDogs = allDogs.filter((dog) => dog.room_id === room.id);
    const currentOccupancy = calculateRoomOccupancy(room, roomDogs);

    // Simulera att lägga till den nya hunden
    const simulatedOccupancy = calculateRoomOccupancy(room, [
      ...roomDogs,
      newDog,
    ]);

    let recommendation_score = 0;
    let reason = "";

    if (simulatedOccupancy.compliance_status === "violation") {
      recommendation_score = 0;
      reason = "Skulle överskrida Jordbruksverkets regler";
    } else if (simulatedOccupancy.compliance_status === "warning") {
      recommendation_score = 3;
      reason = "Möjligt men nära gränsen";
    } else {
      // Poäng baserat på hur mycket plats som finns kvar
      const space_utilization = simulatedOccupancy.occupancy_percentage;
      if (space_utilization < 50) {
        recommendation_score = 10;
        reason = "Utmärkt - gott om plats";
      } else if (space_utilization < 70) {
        recommendation_score = 8;
        reason = "Bra - lagom beläggning";
      } else {
        recommendation_score = 6;
        reason = "OK - blir ganska fullt";
      }
    }

    return {
      room,
      occupancy: simulatedOccupancy,
      recommendation_score,
      reason,
    };
  });

  return recommendations.sort(
    (a, b) => b.recommendation_score - a.recommendation_score
  );
}
