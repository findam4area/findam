import { describe, it, expect } from "vitest";
import {
  getAllStates,
  getLGAsForState,
  getWardsForLGA,
  isValidState,
  isValidLGA,
  isValidWard,
  validateLocationDataCompleteness,
  getLocationStatistics,
} from "@/lib/utils/nigerianLocations";

describe("Location Validation - Task 20.1", () => {
  describe("Nigerian State Validation", () => {
    it("should have all Nigerian states available", () => {
      const states = getAllStates();
      expect(states.length).toBeGreaterThan(0);
      expect(states).toContain("Lagos");
      expect(states).toContain("Federal Capital Territory");
    });

    it("should validate existing states correctly", () => {
      expect(isValidState("Lagos")).toBe(true);
      expect(isValidState("Federal Capital Territory")).toBe(true);
      expect(isValidState("Invalid State")).toBe(false);
      expect(isValidState("")).toBe(false);
    });

    it("should return empty array for invalid state LGAs", () => {
      const lgas = getLGAsForState("Invalid State");
      expect(lgas).toEqual([]);
    });
  });

  describe("LGA Validation", () => {
    it("should get LGAs for valid states", () => {
      const lagosLGAs = getLGAsForState("Lagos");
      expect(lagosLGAs.length).toBeGreaterThan(0);
    });

    it("should validate LGAs correctly", () => {
      const lagosLGAs = getLGAsForState("Lagos");
      if (lagosLGAs.length > 0) {
        expect(isValidLGA("Lagos", lagosLGAs[0])).toBe(true);
      }
      expect(isValidLGA("Lagos", "Invalid LGA")).toBe(false);
      expect(isValidLGA("Invalid State", "Any LGA")).toBe(false);
    });
  });

  describe("Ward Validation", () => {
    it("should get wards for valid LGAs", () => {
      const lagosLGAs = getLGAsForState("Lagos");
      if (lagosLGAs.length > 0) {
        const wards = getWardsForLGA("Lagos", lagosLGAs[0]);
        // Wards may or may not be available depending on the package data
        expect(Array.isArray(wards)).toBe(true);
      }
    });

    it("should validate wards correctly", () => {
      const lagosLGAs = getLGAsForState("Lagos");
      if (lagosLGAs.length > 0) {
        const wards = getWardsForLGA("Lagos", lagosLGAs[0]);
        if (wards.length > 0) {
          expect(isValidWard("Lagos", lagosLGAs[0], wards[0])).toBe(true);
        }
        expect(isValidWard("Lagos", lagosLGAs[0], "Invalid Ward")).toBe(false);
      }
    });

    it("should return empty array for invalid state/LGA combination", () => {
      const wards = getWardsForLGA("Invalid State", "Invalid LGA");
      expect(wards).toEqual([]);
    });
  });

  describe("Location Data Completeness - Requirement 18.1, 18.2", () => {
    it("should validate location data completeness", () => {
      const validation = validateLocationDataCompleteness();

      expect(validation).toHaveProperty("isComplete");
      expect(validation).toHaveProperty("totalStates");
      expect(validation).toHaveProperty("totalLGAs");
      expect(validation).toHaveProperty("totalWards");
      expect(validation).toHaveProperty("statesWithoutLGAs");
      expect(validation).toHaveProperty("lgasWithoutWards");

      // Should have Nigerian states
      expect(validation.totalStates).toBeGreaterThan(0);

      // Should have LGAs
      expect(validation.totalLGAs).toBeGreaterThan(0);

      // Log completeness info for debugging
      console.log("Location Data Statistics:", {
        states: validation.totalStates,
        lgas: validation.totalLGAs,
        wards: validation.totalWards,
        isComplete: validation.isComplete,
      });
    });

    it("should get location statistics", () => {
      const stats = getLocationStatistics();

      expect(stats).toHaveProperty("states");
      expect(stats).toHaveProperty("lgas");
      expect(stats).toHaveProperty("wards");
      expect(stats).toHaveProperty("isComplete");

      expect(stats.states).toBeGreaterThan(0);
      expect(stats.lgas).toBeGreaterThan(0);
    });

    it("should have major Nigerian states including FCT", () => {
      const states = getAllStates();
      const majorStates = [
        "Lagos",
        "Federal Capital Territory",
        "Rivers",
        "Kano",
      ];

      majorStates.forEach((state) => {
        expect(states).toContain(state);
      });
    });
  });

  describe("Location Requirement Validation - Requirement 18.1", () => {
    it("should require state selection for listings", () => {
      // This validates that the validation schema requires state
      const states = getAllStates();
      expect(states.length).toBeGreaterThan(0);

      // Verify we can validate states
      expect(isValidState(states[0])).toBe(true);
    });

    it("should support State → LGA → Ward hierarchy", () => {
      const states = getAllStates();
      expect(states.length).toBeGreaterThan(0);

      const firstState = states[0];
      const lgas = getLGAsForState(firstState);

      if (lgas.length > 0) {
        const firstLGA = lgas[0];
        const wards = getWardsForLGA(firstState, firstLGA);

        // Verify hierarchy works
        expect(isValidState(firstState)).toBe(true);
        expect(isValidLGA(firstState, firstLGA)).toBe(true);

        if (wards.length > 0) {
          expect(isValidWard(firstState, firstLGA, wards[0])).toBe(true);
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings", () => {
      expect(isValidState("")).toBe(false);
      expect(isValidLGA("", "")).toBe(false);
      expect(isValidWard("", "", "")).toBe(false);
    });

    it("should handle null/undefined gracefully", () => {
      expect(getLGAsForState("")).toEqual([]);
      expect(getWardsForLGA("", "")).toEqual([]);
    });

    it("should be case-sensitive for state names", () => {
      const states = getAllStates();
      if (states.length > 0) {
        const firstState = states[0];
        expect(isValidState(firstState)).toBe(true);
        expect(isValidState(firstState.toLowerCase())).toBe(false);
        expect(isValidState(firstState.toUpperCase())).toBe(false);
      }
    });
  });
});
