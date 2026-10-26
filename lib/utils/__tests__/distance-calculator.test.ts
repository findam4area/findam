/**
 * Unit tests for distance calculator
 * 
 * Tests Requirements: 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistance,
  buildPostGISRadiusQuery,
  buildPostGISDistanceQuery,
  isValidRadius,
  formatDistance,
  addDistanceToResults,
  SUPPORTED_RADII,
} from "../distance-calculator";

describe("calculateHaversineDistance", () => {
  it("should calculate distance between two points correctly", () => {
    // Lagos to Abuja (approximate distance ~526km)
    const lagosLat = 6.5244;
    const lagosLng = 3.3792;
    const abujaLat = 9.0765;
    const abujaLng = 7.3986;

    const distance = calculateHaversineDistance(
      lagosLat,
      lagosLng,
      abujaLat,
      abujaLng
    );

    // Distance should be approximately 526km (allow 10% margin)
    expect(distance).toBeGreaterThan(470);
    expect(distance).toBeLessThan(580);
  });

  it("should return 0 for same location", () => {
    const lat = 6.5244;
    const lng = 3.3792;

    const distance = calculateHaversineDistance(lat, lng, lat, lng);

    expect(distance).toBeCloseTo(0, 1);
  });

  it("should calculate small distances accurately", () => {
    // Two points in Lagos ~10km apart
    const lat1 = 6.5244;
    const lng1 = 3.3792;
    const lat2 = 6.6;
    const lng2 = 3.4;

    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);

    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(15);
  });
});

describe("buildPostGISRadiusQuery", () => {
  it("should generate correct SQL for ST_DWithin query", () => {
    const lat = 6.5244;
    const lng = 3.3792;
    const radius = 10; // km

    const result = buildPostGISRadiusQuery(lat, lng, radius);

    expect(result.sql).toContain("ST_DWithin");
    expect(result.sql).toContain("ST_SetSRID");
    expect(result.sql).toContain("ST_MakePoint");
    expect(result.params).toEqual([lng, lat, 10000]); // Note: lng, lat order and meters
  });

  it("should convert radius to meters (Requirement 6.2)", () => {
    const lat = 6.5244;
    const lng = 3.3792;
    const radiusKm = 25;

    const result = buildPostGISRadiusQuery(lat, lng, radiusKm);

    expect(result.params[2]).toBe(25000); // 25km = 25000 meters
  });

  it("should support all valid radius values (Requirement 6.2)", () => {
    const lat = 6.5244;
    const lng = 3.3792;

    SUPPORTED_RADII.forEach((radius) => {
      const result = buildPostGISRadiusQuery(lat, lng, radius);
      expect(result.params[2]).toBe(radius * 1000);
    });
  });
});

describe("buildPostGISDistanceQuery", () => {
  it("should generate correct SQL for ST_Distance query", () => {
    const lat = 6.5244;
    const lng = 3.3792;

    const result = buildPostGISDistanceQuery(lat, lng);

    expect(result.sql).toContain("ST_Distance");
    expect(result.sql).toContain("ST_SetSRID");
    expect(result.sql).toContain("ST_MakePoint");
    expect(result.sql).toContain("ROUND");
    expect(result.sql).toContain("/ 1000"); // Convert meters to kilometers
    expect(result.params).toEqual([lng, lat]);
  });
});

describe("isValidRadius", () => {
  it("should return true for supported radii (Requirement 6.2)", () => {
    expect(isValidRadius(5)).toBe(true);
    expect(isValidRadius(10)).toBe(true);
    expect(isValidRadius(25)).toBe(true);
    expect(isValidRadius(50)).toBe(true);
    expect(isValidRadius(80)).toBe(true);
  });

  it("should return false for unsupported radii", () => {
    expect(isValidRadius(3)).toBe(false);
    expect(isValidRadius(15)).toBe(false);
    expect(isValidRadius(100)).toBe(false);
    expect(isValidRadius(0)).toBe(false);
    expect(isValidRadius(-10)).toBe(false);
  });
});

describe("formatDistance", () => {
  it("should format distances less than 1km in meters", () => {
    expect(formatDistance(0.5)).toBe("500 m");
    expect(formatDistance(0.123)).toBe("123 m");
    expect(formatDistance(0.999)).toBe("999 m");
  });

  it("should format distances >= 1km in kilometers with 1 decimal", () => {
    expect(formatDistance(1.0)).toBe("1.0 km");
    expect(formatDistance(5.5)).toBe("5.5 km");
    expect(formatDistance(25.789)).toBe("25.8 km");
    expect(formatDistance(100)).toBe("100.0 km");
  });

  it("should handle edge cases", () => {
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(0.001)).toBe("1 m");
    expect(formatDistance(1000)).toBe("1000.0 km");
  });
});

describe("addDistanceToResults", () => {
  it("should add distance field to businesses with coordinates (Requirement 6.5)", () => {
    const businesses = [
      {
        id: "1",
        name: "Business 1",
        coordinates: { lat: 6.5244, lng: 3.3792 },
      },
      {
        id: "2",
        name: "Business 2",
        coordinates: { lat: 6.6, lng: 3.4 },
      },
    ];

    const userLat = 6.5244;
    const userLng = 3.3792;

    const results = addDistanceToResults(businesses, userLat, userLng);

    expect(results[0].distance_km).toBeDefined();
    expect(results[0].distance_km).toBeCloseTo(0, 1); // Same location
    expect(results[1].distance_km).toBeDefined();
    expect(results[1].distance_km).toBeGreaterThan(0);
  });

  it("should not add distance field to businesses without coordinates", () => {
    const businesses = [
      {
        id: "1",
        name: "Business 1",
        coordinates: undefined,
      },
      {
        id: "2",
        name: "Business 2",
        coordinates: { lat: 6.6, lng: 3.4 },
      },
    ];

    const userLat = 6.5244;
    const userLng = 3.3792;

    const results = addDistanceToResults(businesses, userLat, userLng);

    expect(results[0].distance_km).toBeUndefined();
    expect(results[1].distance_km).toBeDefined();
  });

  it("should round distances to 2 decimal places", () => {
    const businesses = [
      {
        id: "1",
        name: "Business 1",
        coordinates: { lat: 6.5244, lng: 3.3792 },
      },
    ];

    const userLat = 6.6;
    const userLng = 3.4;

    const results = addDistanceToResults(businesses, userLat, userLng);

    expect(results[0].distance_km).toBeDefined();
    // Check it's rounded to 2 decimals
    const decimalPart = results[0].distance_km!.toString().split(".")[1];
    if (decimalPart) {
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    }
  });

  it("should handle empty array", () => {
    const businesses: any[] = [];
    const results = addDistanceToResults(businesses, 6.5244, 3.3792);

    expect(results).toEqual([]);
  });
});

describe("SUPPORTED_RADII constant", () => {
  it("should contain exactly 5 radius options (Requirement 6.2)", () => {
    expect(SUPPORTED_RADII).toHaveLength(5);
    expect(SUPPORTED_RADII).toEqual([5, 10, 25, 50, 80]);
  });
});
