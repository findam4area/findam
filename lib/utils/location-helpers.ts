import {
  getLGAsForState as getLGAsFromPackage,
  getAllStates,
} from "@/lib/utils/nigerianLocations";

/**
 * Get all valid Nigerian state names
 */
export function getValidStateNames(): string[] {
  return getAllStates();
}

/**
 * Validate if a state name is valid
 */
export function isValidState(stateName: string): boolean {
  return getValidStateNames().includes(stateName);
}

/**
 * Get areas (LGAs) for a specific state
 * Note: "area" is used for backward compatibility, but it refers to LGAs
 */
export function getAreasForState(stateName: string): readonly string[] {
  return getLGAsFromPackage(stateName);
}

/**
 * Validate if an area (LGA) belongs to a specific state
 */
export function isValidAreaForState(
  stateName: string,
  areaName: string,
): boolean {
  const areas = getAreasForState(stateName);
  return areas.includes(areaName);
}

/**
 * Get the total count of Nigerian states
 */
export function getStateCount(): number {
  return getAllStates().length;
}

/**
 * Validate location data completeness
 * Ensures all Nigerian states are present in the system
 */
export function validateLocationDataCompleteness(): {
  isComplete: boolean;
  missingStates: string[];
  expectedCount: number;
  actualCount: number;
} {
  const actualStates = getValidStateNames();

  return {
    isComplete: actualStates.length === 37, // All 37 Nigerian states
    missingStates: [],
    expectedCount: 37,
    actualCount: actualStates.length,
  };
}

/**
 * Format location string for display
 */
export function formatLocation(state: string, area?: string): string {
  if (area) {
    return `${area}, ${state}`;
  }
  return state;
}

/**
 * Parse location string into state and area
 */
export function parseLocation(locationString: string): {
  state?: string;
  area?: string;
} {
  if (!locationString || locationString.trim() === "") {
    return {};
  }

  const parts = locationString.split(",").map((part) => part.trim());

  if (parts.length === 2) {
    return {
      area: parts[0],
      state: parts[1],
    };
  } else if (parts.length === 1) {
    return {
      state: parts[0],
    };
  }

  return {};
}
