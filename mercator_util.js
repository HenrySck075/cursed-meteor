Yo = 2 * Math.PI * 6378137 / 2;
class WebMercatorProjection {
    constructor(a=256) {
        this.tileSize = a,
        this.initialResolution = 2 * Yo / this.tileSize
    }
    latLonToMeters(a, h) {
        const y = h / 180 * Yo
          , P = Math.log(Math.tan((90 + a) * Math.PI / 360)) / (Math.PI / 180) * Yo / 180;
        return [y, P]
    }
    metersToLatLon(a, h) {
        const y = a / Yo * 180;
        let P = h / Yo * 180;
        return P = 180 / Math.PI * (2 * Math.atan(Math.exp(P * Math.PI / 180)) - Math.PI / 2),
        [P, y]
    }
    pixelsToMeters(a, h, y) {
        const P = this.resolution(y)
          , z = a * P - Yo
          , b = Yo - h * P;
        return [z, b]
    }
    pixelsToLatLon(a, h, y) {
        const [P,z] = this.pixelsToMeters(a, h, y);
        return this.metersToLatLon(P, z)
    }
    latLonToPixels(a, h, y) {
        const [P,z] = this.latLonToMeters(a, h);
        return this.metersToPixels(P, z, y)
    }
    latLonToPixelsFloor(a, h, y) {
        const [P,z] = this.latLonToPixels(a, h, y);
        return [Math.floor(P), Math.floor(z)]
    }
    metersToPixels(a, h, y) {
        const P = this.resolution(y)
          , z = (a + Yo) / P
          , b = (Yo - h) / P;
        return [z, b]
    }
    latLonToTile(a, h, y) {
        const [P,z] = this.latLonToMeters(a, h);
        return this.metersToTile(P, z, y)
    }
    metersToTile(a, h, y) {
        const [P,z] = this.metersToPixels(a, h, y);
        return this.pixelsToTile(P, z)
    }
    pixelsToTile(a, h) {
        const y = Math.ceil(a / this.tileSize) - 1
          , P = Math.ceil(h / this.tileSize) - 1;
        return [y, P]
    }

    resolution(a) {
        return this.initialResolution / 2 ** a
    }
}