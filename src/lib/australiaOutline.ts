/**
 * Coarse Australia coastline outline (clockwise from Cape York), used as a
 * decorative background reference on the Geographic map view. This is
 * intentionally low-fidelity (a few dozen points) — just enough to be
 * recognisably Australia-shaped, not survey-grade.
 */
export const AUSTRALIA_OUTLINE: { lat: number; lng: number }[] = [
  { lat: -10.7, lng: 142.5 }, // Cape York
  { lat: -16.9, lng: 145.8 }, // Cairns
  { lat: -21.1, lng: 149.2 }, // Mackay
  { lat: -24.9, lng: 152.3 }, // Bundaberg
  { lat: -27.5, lng: 153.4 }, // Brisbane
  { lat: -28.6, lng: 153.6 }, // Byron Bay
  { lat: -33.9, lng: 151.2 }, // Sydney
  { lat: -35.7, lng: 150.2 }, // Batemans Bay
  { lat: -37.5, lng: 149.9 }, // Cape Howe
  { lat: -38.9, lng: 146.3 }, // Wilsons Promontory
  { lat: -38.1, lng: 144.9 }, // Port Phillip
  { lat: -38.85, lng: 143.5 }, // Cape Otway
  { lat: -38.35, lng: 141.6 }, // Portland
  { lat: -38.05, lng: 140.78 }, // SA border
  { lat: -35.8, lng: 137.2 }, // Kangaroo Island area
  { lat: -34.7, lng: 135.2 }, // Eyre Peninsula tip
  { lat: -31.5, lng: 131.1 }, // Head of Bight
  { lat: -31.7, lng: 128.9 }, // Eucla / WA border
  { lat: -33.6, lng: 123.9 }, // Israelite Bay
  { lat: -33.85, lng: 121.9 }, // Esperance
  { lat: -35.0, lng: 117.9 }, // Albany
  { lat: -34.4, lng: 115.1 }, // Cape Leeuwin
  { lat: -32.05, lng: 115.7 }, // Perth / Fremantle
  { lat: -28.77, lng: 114.6 }, // Geraldton
  { lat: -25.9, lng: 113.5 }, // Shark Bay
  { lat: -24.9, lng: 113.7 }, // Carnarvon
  { lat: -21.9, lng: 114.1 }, // North West Cape
  { lat: -20.7, lng: 116.8 }, // Karratha / Dampier
  { lat: -20.3, lng: 118.6 }, // Port Hedland
  { lat: -18.0, lng: 122.2 }, // Broome
  { lat: -16.4, lng: 122.9 }, // Cape Leveque
  { lat: -17.3, lng: 123.6 }, // Derby
  { lat: -15.5, lng: 128.1 }, // Wyndham
  { lat: -12.46, lng: 130.84 }, // Darwin
  { lat: -11.8, lng: 132.5 }, // Van Diemen Gulf
  { lat: -13.0, lng: 136.4 }, // Gulf of Carpentaria (west)
  { lat: -17.5, lng: 140.8 }, // Gulf of Carpentaria (south)
  { lat: -12.6, lng: 141.9 }, // Weipa / Gulf of Carpentaria (east)
];
