/**
 * Distance Calculator
 * 
 * Utilities for calculating geographic distances between coordinates
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

/**
 * Supported radius options for location filtering (in kilometers)
 */
export const SUPPORTED_RADII = [5, 10, 25, 50, 80] as const;
export type RadiusKm = typeof SUPPORTED_RADII[number];

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * 
 * This is a fallback for when PostGIS ST_Distance is not available
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Build PostGIS ST_DWithin query for filtering businesses within a radius
 * 
 * This generates SQL fragment for use in WHERE clause
 * 
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param radiusKm - Radius in kilometers
 * @returns SQL fragment for ST_DWithin condition
 */
export function buildPostGISRadiusQuery(
  userLat: number,
  userLng: number,
  radiusKm: RadiusKm
): { sql: string; params: number[] } {
  // ST_DWithin expects distance in meters
  const radiusMeters = radiusKm * 1000;

  // PostGIS query using ST_DWithin for efficient spatial index usage
  const sql = `ST_DWithin(
    coordinates::geography,
    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
    $3
  )`;

  return {
    sql,
    params: [userLng, userLat, radiusMeters],
  };
}

/**
 * Build PostGIS ST_Distance query for calculating actual distance
 * 
 * This generates SQL fragment for SELECT clause to calculate distance
 * 
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @returns SQL fragment for ST_Distance calculation (returns distance in km)
 */
export function buildPostGISDistanceQuery(
  userLat: number,
  userLng: number
): { sql: string; params: number[] } {
  // ST_Distance returns distance in meters, divide by 1000 for kilometers
  const sql = `ROUND(
    ST_Distance(
      coordinates::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
    ) / 1000,
    2
  )`;

  return {
    sql,
    params: [userLng, userLat],
  };
}

/**
 * Validate that radius is one of the supported values
 */
export function isValidRadius(radius: number): radius is RadiusKm {
  return SUPPORTED_RADII.includes(radius as RadiusKm);
}

/**
 * Format distance for display
 * 
 * @param distanceKm - Distance in kilometers
 * @returns Formatted string (e.g., "2.5 km", "150 m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    // Display in meters for distances less than 1km
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  } else {
    // Display in kilometers with 1 decimal place
    return `${distanceKm.toFixed(1)} km`;
  }
}

/**
 * Add distance field to business search results
 * 
 * @param businesses - Array of businesses with coordinates
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @returns Businesses with added distance field
 */
export function addDistanceToResults<T extends { 
  coordinates?: { lat: number; lng: number };
}>(
  businesses: T[],
  userLat: number,
  userLng: number
): (T & { distance_km?: number })[] {
  return businesses.map((business) => {
    if (!business.coordinates) {
      return business;
    }

    const distance = calculateHaversineDistance(
      userLat,
      userLng,
      business.coordinates.lat,
      business.coordinates.lng
    );

    return {
      ...business,
      distance_km: Math.round(distance * 100) / 100, // Round to 2 decimals
    };
  });
}
