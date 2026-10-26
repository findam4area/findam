import {
  all as getAllLocationData,
  states as getStatesFunction,
} from "nigeria-states-lgas";
import type { StateData } from "nigeria-states-lgas";

export interface LGA {
  name: string;
}

export interface State {
  name: string;
  lgas: LGA[];
}

// Cache the location data
let cachedLocationData: StateData[] | null = null;

function getLocationData(): StateData[] {
  if (!cachedLocationData) {
    cachedLocationData = getAllLocationData();
  }
  return cachedLocationData;
}

/**
 * Get all Nigerian states with their LGAs
 */
export const NIGERIAN_LOCATIONS: State[] = getLocationData().map(
  (stateData) => ({
    name: stateData.state,
    lgas: stateData.lgas.map((lga) => ({ name: lga })),
  }),
);

/**
 * Get all Nigerian states
 */
export function getAllStates(): string[] {
  return getStatesFunction();
}

/**
 * Get LGAs for a specific state
 * @param stateName - Name of the state
 * @returns Array of LGA names
 */
export function getLGAsForState(stateName: string): string[] {
  const locationData = getLocationData();
  const state = locationData.find((s) => s.state === stateName);
  return state ? state.lgas : [];
}

/**
 * Get wards for a specific LGA in a state
 * Note: The nigeria-states-lgas package doesn't include ward data
 * @param stateName - Name of the state
 * @param lgaName - Name of the LGA
 * @returns Array of ward names (empty for this package)
 */
export function getWardsForLGA(stateName: string, lgaName: string): string[] {
  // The nigeria-states-lgas package doesn't include ward data
  // This function is kept for API compatibility
  return [];
}

/**
 * Validate if a state exists
 */
export function isValidState(stateName: string): boolean {
  return getStatesFunction().includes(stateName);
}

/**
 * Validate if an LGA exists in a state
 */
export function isValidLGA(stateName: string, lgaName: string): boolean {
  const lgas = getLGAsForState(stateName);
  return lgas.includes(lgaName);
}

/**
 * Validate if a ward exists in an LGA
 * Note: The nigeria-states-lgas package doesn't include ward data
 */
export function isValidWard(
  stateName: string,
  lgaName: string,
  wardName: string,
): boolean {
  // The nigeria-states-lgas package doesn't include ward data
  // This function is kept for API compatibility
  return false;
}

/**
 * Validate location data completeness
 * Ensures all Nigerian states from the nigeria-states-lgas package are available
 */
export function validateLocationDataCompleteness(): {
  isComplete: boolean;
  totalStates: number;
  totalLGAs: number;
  totalWards: number;
  statesWithoutLGAs: string[];
  lgasWithoutWards: Array<{ state: string; lga: string }>;
} {
  const locationData = getLocationData();
  let totalLGAs = 0;
  const statesWithoutLGAs: string[] = [];

  locationData.forEach((state) => {
    if (!state.lgas || state.lgas.length === 0) {
      statesWithoutLGAs.push(state.state);
    } else {
      totalLGAs += state.lgas.length;
    }
  });

  return {
    isComplete: statesWithoutLGAs.length === 0,
    totalStates: locationData.length,
    totalLGAs,
    totalWards: 0, // Package doesn't include ward data
    statesWithoutLGAs,
    lgasWithoutWards: [], // Package doesn't include ward data
  };
}

/**
 * Get location statistics
 */
export function getLocationStatistics() {
  const validation = validateLocationDataCompleteness();
  return {
    states: validation.totalStates,
    lgas: validation.totalLGAs,
    wards: validation.totalWards,
    isComplete: validation.isComplete,
  };
}
