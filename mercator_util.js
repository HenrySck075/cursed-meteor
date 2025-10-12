      
/**
 * AI-prettified code from the uglified bundle in wplace
 * 
 * Utility class for converting between WGS84 (Lat/Lon) coordinates,
 * Web Mercator (Meters) coordinates, Pixels, and Tiles at various zoom levels.
 *
 * It assumes the standard Web Mercator projection (EPSG:3857) where the
 * world extent is a square.
 */

// Half of the circumference of the Earth in Web Mercator meters
// (2 * PI * 6378137 / 2) is the semi-circumference.
// 6378137 meters is the Earth's equatorial radius (WGS84 ellipsoid).
const WEB_MERCATOR_MAX_EXTENT = 2 * Math.PI * 6378137 / 2;

class WebMercatorProjection {
  /**
   * @param {number} [tileSize=256] The size of a map tile in pixels (e.g., 256 or 512).
   */
  constructor(tileSize = 256) {
    this.tileSize = tileSize;
    // The resolution at zoom level 0 (meters per pixel)
    // The world width (2 * WEB_MERCATOR_MAX_EXTENT) divided by the pixels at zoom 0 (tileSize)
    this.initialResolution = (2 * WEB_MERCATOR_MAX_EXTENT) / this.tileSize;
  }

  /**
   * Converts a Lat/Lon coordinate to Web Mercator meters (x, y).
   * @param {number} lat - Latitude in degrees.
   * @param {number} lon - Longitude in degrees.
   * @returns {[number, number]} - [metersX, metersY]
   */
  latLonToMeters(lat, lon) {
    // X (Easting) conversion: simple scaling of longitude
    let metersX = lon * WEB_MERCATOR_MAX_EXTENT / 180;

    // Y (Northing) conversion: uses a logarithmic projection
    let metersY = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * WEB_MERCATOR_MAX_EXTENT / 180;

    return [metersX, metersY];
  }

  /**
   * Converts Web Mercator meters (x, y) to a Lat/Lon coordinate.
   * @param {number} metersX - X coordinate in meters.
   * @param {number} metersY - Y coordinate in meters.
   * @returns {[number, number]} - [latitude, longitude]
   */
  metersToLatLon(metersX, metersY) {
    // Longitude conversion
    let lon = metersX / WEB_MERCATOR_MAX_EXTENT * 180;

    // Latitude conversion (inverse of the logarithmic projection)
    let lat = metersY / WEB_MERCATOR_MAX_EXTENT * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);

    return [lat, lon];
  }

  /**
   * Calculates the map resolution (meters per pixel) for a given zoom level.
   * @param {number} zoom - The map zoom level (integer).
   * @returns {number} - Resolution (meters/pixel).
   */
  getResolution(zoom) {
    // Resolution halves with each increase in zoom level.
    return this.initialResolution / (2 ** zoom);
  }

  /**
   * Converts a pixel coordinate at a given zoom level to Web Mercator meters.
   * Origin (0, 0) is typically the top-left corner of the map extent.
   * @param {number} pixelX - X pixel coordinate (from the whole world map).
   * @param {number} pixelY - Y pixel coordinate (from the whole world map).
   * @param {number} zoom - The map zoom level.
   * @returns {[number, number]} - [metersX, metersY]
   */
  pixelsToMeters(pixelX, pixelY, zoom) {
    const resolution = this.getResolution(zoom);
    // metersX = pixelX * resolution - MaxExtent
    const metersX = pixelX * resolution - WEB_MERCATOR_MAX_EXTENT;
    // metersY = MaxExtent - pixelY * resolution (Y axis is inverted from pixels to meters)
    const metersY = WEB_MERCATOR_MAX_EXTENT - pixelY * resolution;

    return [metersX, metersY];
  }

  /**
   * Converts a pixel coordinate at a given zoom level to Lat/Lon.
   * @param {number} pixelX - X pixel coordinate.
   * @param {number} pixelY - Y pixel coordinate.
   * @param {number} zoom - The map zoom level.
   * @returns {[number, number]} - [latitude, longitude]
   */
  pixelsToLatLon(pixelX, pixelY, zoom) {
    const [metersX, metersY] = this.pixelsToMeters(pixelX, pixelY, zoom);
    return this.metersToLatLon(metersX, metersY);
  }

  /**
   * Converts a Lat/Lon coordinate to a pixel coordinate at a given zoom level.
   * @param {number} lat - Latitude in degrees.
   * @param {number} lon - Longitude in degrees.
   * @param {number} zoom - The map zoom level.
   * @returns {[number, number]} - [pixelX, pixelY]
   */
  latLonToPixels(lat, lon, zoom) {
    const [metersX, metersY] = this.latLonToMeters(lat, lon);
    return this.metersToPixels(metersX, metersY, zoom);
  }

  /**
   * Converts a Lat/Lon coordinate to a *floored* pixel coordinate (integer)
   * at a given zoom level.
   * @param {number} lat - Latitude in degrees.
   * @param {number} lon - Longitude in degrees.
   * @param {number} zoom - The map zoom level.
   * @returns {[number, number]} - [floorPixelX, floorPixelY]
   */
  latLonToPixelsFloor(lat, lon, zoom) {
    const [pixelX, pixelY] = this.latLonToPixels(lat, lon, zoom);
    return [Math.floor(pixelX), Math.floor(pixelY)];
  }

  /**
   * Converts Web Mercator meters to a pixel coordinate at a given zoom level.
   * @param {number} metersX - X coordinate in meters.
   * @param {number} metersY - Y coordinate in meters.
   * @param {number} zoom - The map zoom level.
   * @returns {[number, number]} - [pixelX, pixelY]
   */
  metersToPixels(metersX, metersY, zoom) {
    const resolution = this.getResolution(zoom);
    // pixelX = (metersX + MaxExtent) / resolution
    const pixelX = (metersX + WEB_MERCATOR_MAX_EXTENT) / resolution;
    // pixelY = (MaxExtent - metersY) / resolution
    const pixelY = (WEB_MERCATOR_MAX_EXTENT - metersY) / resolution;

    return [pixelX, pixelY];
  }

  /**
   * Converts a Lat/Lon coordinate to a tile coordinate at a given zoom level.
   * @param {number} lat - Latitude in degrees.
   * @param {number} lon - Longitude in degrees.
   * @param {number} zoom - The map zoom level.
   * @returns {[number, number]} - [tileX, tileY]
   */
  latLonToTile(lat, lon, zoom) {
    const [metersX, metersY] = this.latLonToMeters(lat, lon);
    return this.metersToTile(metersX, metersY, zoom);
  }

  /**
   * Converts Web Mercator meters to a tile coordinate at a given zoom level.
   * @param {number} metersX - X coordinate in meters.
   * @param {number} metersY - Y coordinate in meters.
   * @param {number} zoom - The map zoom level.
   * @returns {[number, number]} - [tileX, tileY]
   */
  metersToTile(metersX, metersY, zoom) {
    const [pixelX, pixelY] = this.metersToPixels(metersX, metersY, zoom);
    return this.pixelsToTile(pixelX, pixelY);
  }

  /**
   * Converts a pixel coordinate to a tile coordinate.
   * Tile coordinates are 0-indexed from the top-left of the world map.
   * @param {number} pixelX - X pixel coordinate.
   * @param {number} pixelY - Y pixel coordinate.
   * @returns {[number, number]} - [tileX, tileY]
   */
  pixelsToTile(pixelX, pixelY) {
    // Tile index is the ceiling of (pixel / tileSize) - 1.
    // E.g., for tileSize=256, pixels 0-255 are in tile 0. (ceil(0/256)-1 = -1, ceil(256/256)-1 = 0)
    // The minified code uses: Math.ceil(a/this.tileSize)-1. This seems potentially incorrect
    // for pixel values starting at 0, or assumes a 1-based index in the logic.
    // The standard tile index is: Math.floor(pixel / tileSize)
    // However, to match the original *minified* logic, we keep the original calculation.
    const tileX = Math.ceil(pixelX / this.tileSize) - 1;
    const tileY = Math.ceil(pixelY / this.tileSize) - 1;

    return [tileX, tileY];
  }

  /**
   * Converts a Lat/Lon coordinate to both the tile coordinate and the
   * relative pixel coordinate *within* that tile, at a given zoom level.
   * @param {number} lat - Latitude in degrees.
   * @param {number} lon - Longitude in degrees.
   * @param {number} zoom - The map zoom level.
   * @returns {{tile: [number, number], pixel: [number, number]}} - An object with tile and pixel coordinates.
   */
  latLonToTileAndPixel(lat, lon, zoom) {
    const [metersX, metersY] = this.latLonToMeters(lat, lon);
    const [tileX, tileY] = this.metersToTile(metersX, metersY, zoom);
    const [pixelX, pixelY] = this.metersToPixels(metersX, metersY, zoom);

    // Relative pixel is the world pixel coordinate modulo the tile size
    const relativePixelX = Math.floor(pixelX) % this.tileSize;
    const relativePixelY = Math.floor(pixelY) % this.tileSize;

    return {
      tile: [tileX, tileY],
      pixel: [relativePixelX, relativePixelY]
    };
  }
}
