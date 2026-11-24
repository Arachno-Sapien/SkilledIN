import localitiesData from "../data/localities.json" with { type: "json" };
import { GeoPlacesClient, GeocodeCommand } from "@aws-sdk/client-geo-places";

export interface GeoLocation {
  lat: number;
  lng: number;
  displayName?: string;
}

const localities: { name: string; lat: number; lng: number }[] = localitiesData;

let geoPlacesClient: GeoPlacesClient | null = null;

function getGeoClient(): GeoPlacesClient {
  if (!geoPlacesClient) {
    geoPlacesClient = new GeoPlacesClient({
      region: process.env.AWS_REGION || "ap-south-1",
    });
  }
  return geoPlacesClient;
}

/**
 * Geocode an area or locality name.
 * 1. Fast match against localities.json (Bengaluru) case-insensitively.
 * 2. Amazon Location Places API on a miss.
 * Returns { lat, lng } or null on a miss. NEVER throws.
 */
export async function geocode(areaName: string): Promise<GeoLocation | null> {
  if (!areaName || typeof areaName !== "string") {
    return null;
  }

  const clean = areaName.trim().toLowerCase();

  // 1. Local localities cache
  const localMatch = localities.find(
    (loc) => loc.name.toLowerCase() === clean || clean.includes(loc.name.toLowerCase())
  );
  if (localMatch) {
    return {
      lat: localMatch.lat,
      lng: localMatch.lng,
      displayName: localMatch.name,
    };
  }

  // 2. AWS Location Places API fallback
  try {
    const client = getGeoClient();
    const command = new GeocodeCommand({
      QueryText: `${areaName}, Bengaluru, Karnataka, India`,
      Filter: {
        IncludeCountries: ["IND"],
      },
      BiasPosition: [77.5946, 12.9716], // Bengaluru center [lon, lat]
      MaxResults: 1,
    });

    const response = await client.send(command);
    const result = response.ResultItems?.[0];
    if (result && result.Position && result.Position.length >= 2) {
      const [lon, lat] = result.Position;
      return {
        lat,
        lng: lon,
        displayName: result.Title || areaName,
      };
    }
  } catch (err) {
    // Never throw on geocode failure; treat as a miss
    console.warn("Amazon Location geocoding miss or offline:", (err as Error).message);
  }

  return null;
}
