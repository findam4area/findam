/**
 * Mapbox Configuration
 * Used for interactive maps and location picking
 */

export const MAPBOX_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

// Nigeria center coordinates
export const NIGERIA_CENTER: [number, number] = [8.6753, 9.082];

// Nigeria bounds
export const NIGERIA_BOUNDS: [[number, number], [number, number]] = [
  [2.6917, 4.2406], // Southwest coordinates
  [14.6778, 13.8659], // Northeast coordinates
];

// Default zoom level
export const DEFAULT_ZOOM = 6;

// Major Nigerian cities coordinates
export const MAJOR_CITIES = {
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abuja: { lat: 9.0765, lng: 7.3986 },
  "Port Harcourt": { lat: 4.8156, lng: 7.0498 },
  Kano: { lat: 12.0022, lng: 8.592 },
  Ibadan: { lat: 7.3775, lng: 3.947 },
  Kaduna: { lat: 10.5105, lng: 7.4165 },
  Benin: { lat: 6.3405, lng: 5.6037 },
  Enugu: { lat: 6.5244, lng: 7.5106 },
};

/**
 * Get coordinates for a Nigerian city
 */
export function getCityCoordinates(
  city: string,
): { lat: number; lng: number } | null {
  return MAJOR_CITIES[city as keyof typeof MAJOR_CITIES] || null;
}
