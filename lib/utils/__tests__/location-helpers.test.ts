import { describe, it, expect } from "vitest";
import {
  getValidStateNames,
  isValidState,
  getAreasForState,
  isValidAreaForState,
  getStateCount,
  validateLocationDataCompleteness,
  formatLocation,
  parseLocation,
} from "../location-helpers";

describe("Location Helpers", () => {
  describe("getValidStateNames", () => {
    it("should return all Nigerian state names", () => {
      const states = getValidStateNames();
      expect(states).toHaveLength(37); // All 37 Nigerian states (36 + FCT)
      expect(states).toContain("Lagos");
      expect(states).toContain("Federal Capital Territory");
      expect(states).toContain("Rivers");
      expect(states).toContain("Kano");
      expect(states).toContain("Oyo");
      expect(states).toContain("Kaduna");
      expect(states).toContain("Enugu");
    });
  });

  describe("isValidState", () => {
    it("should return true for valid states", () => {
      expect(isValidState("Lagos")).toBe(true);
      expect(isValidState("Federal Capital Territory")).toBe(true);
      expect(isValidState("Rivers")).toBe(true);
    });

    it("should return false for invalid states", () => {
      expect(isValidState("Invalid State")).toBe(false);
      expect(isValidState("")).toBe(false);
      expect(isValidState("Abuja")).toBe(false); // Must be "Federal Capital Territory"
    });
  });

  describe("getAreasForState", () => {
    it("should return areas for Lagos", () => {
      const areas = getAreasForState("Lagos");
      expect(areas.length).toBeGreaterThan(0);
      expect(areas).toContain("Agege");
      expect(areas).toContain("Alimosho");
      expect(areas).toContain("Eti-Osa");
    });

    it("should return areas for Abuja (FCT)", () => {
      const areas = getAreasForState("Federal Capital Territory");
      expect(areas.length).toBeGreaterThan(0);
      expect(areas).toContain("Abuja Municipal Area Council");
      expect(areas).toContain("Gwagwalada");
    });

    it("should return empty array for invalid state", () => {
      const areas = getAreasForState("Invalid State");
      expect(areas).toEqual([]);
    });
  });

  describe("isValidAreaForState", () => {
    it("should return true for valid area-state combinations", () => {
      expect(isValidAreaForState("Lagos", "Agege")).toBe(true);
      expect(
        isValidAreaForState(
          "Federal Capital Territory",
          "Abuja Municipal Area Council",
        ),
      ).toBe(true);
      expect(isValidAreaForState("Rivers", "Aboa/Odual")).toBe(true);
    });

    it("should return false for invalid area-state combinations", () => {
      expect(isValidAreaForState("Lagos", "Gwagwalada")).toBe(false); // Gwagwalada is in FCT
      expect(isValidAreaForState("Rivers", "Agege")).toBe(false); // Agege is in Lagos
      expect(isValidAreaForState("Invalid State", "Agege")).toBe(false);
    });
  });

  describe("getStateCount", () => {
    it("should return 37 (all Nigerian states)", () => {
      expect(getStateCount()).toBe(37);
    });
  });

  describe("validateLocationDataCompleteness", () => {
    it("should validate that all required states are present", () => {
      const result = validateLocationDataCompleteness();
      expect(result.isComplete).toBe(true);
      expect(result.missingStates).toEqual([]);
      expect(result.expectedCount).toBe(37);
      expect(result.actualCount).toBe(37);
    });
  });

  describe("formatLocation", () => {
    it("should format location with area and state", () => {
      expect(formatLocation("Lagos", "Ikeja")).toBe("Ikeja, Lagos");
    });

    it("should format location with state only", () => {
      expect(formatLocation("Lagos")).toBe("Lagos");
    });

    it("should handle undefined area", () => {
      expect(formatLocation("Lagos", undefined)).toBe("Lagos");
    });
  });

  describe("parseLocation", () => {
    it("should parse location with area and state", () => {
      const result = parseLocation("Ikeja, Lagos");
      expect(result.area).toBe("Ikeja");
      expect(result.state).toBe("Lagos");
    });

    it("should parse location with state only", () => {
      const result = parseLocation("Lagos");
      expect(result.state).toBe("Lagos");
      expect(result.area).toBeUndefined();
    });

    it("should handle empty string", () => {
      const result = parseLocation("");
      expect(result.state).toBeUndefined();
      expect(result.area).toBeUndefined();
    });
  });
});
