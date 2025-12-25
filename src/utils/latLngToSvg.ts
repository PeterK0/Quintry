/**
 * Convert latitude/longitude coordinates to SVG coordinates
 * Using a simple Mercator-ish projection
 *
 * Note: When using react-simple-maps, this utility may not be needed
 * as the library handles projections automatically via Marker components
 */
export function latLngToSvg(
  lat: number,
  lng: number,
  width: number,
  height: number
): { x: number; y: number } {
  // Simple equirectangular projection
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;

  return { x, y };
}
