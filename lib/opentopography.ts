import { env, isOpenTopographyConfigured } from '@/config/env';

export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
  stationName?: string;
}

export async function getElevationProfile(
  points: [number, number][],
  totalDistanceKm: number
): Promise<ElevationPoint[]> {
  if (!isOpenTopographyConfigured()) {
    throw new Error('OPENTOPOGRAPHY_NOT_CONFIGURED: OPENTOPOGRAPHY_API_KEY is not configured in your environment.');
  }

  if (!points || points.length === 0) return [];

  // Build point list string for OpenTopography Global DEM API
  const locations = points.map(([lng, lat]) => `${lat},${lng}`).join('|');
  const url = `https://portal.opentopography.org/API/globaldem?demtype=SRTMGL1&locations=${encodeURIComponent(
    locations
  )}&outputFormat=JSON&API_Key=${env.OPENTOPOGRAPHY_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`OpenTopography API error (${res.status}): ${errorText || res.statusText}`);
  }

  const data = await res.json();
  if (data && Array.isArray(data.elevations)) {
    const step = totalDistanceKm / (data.elevations.length - 1 || 1);
    return data.elevations.map((elev: number, idx: number) => ({
      distanceKm: Math.round(idx * step),
      elevationM: Math.round(elev),
    }));
  }

  return [];
}

