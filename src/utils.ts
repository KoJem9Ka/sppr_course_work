import { TTwoPoints } from './types'


const deg2rad = (deg: number) => deg * (Math.PI / 180)

export function pointsDistanceMeters({ p1_lon, p1_lat, p2_lon, p2_lat }: TTwoPoints) {
  const dLat = deg2rad(p2_lat - p1_lat)
  const dLon = deg2rad(p2_lon - p1_lon)
  const a    =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(p1_lat)) * Math.cos(deg2rad(p2_lat)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c    = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const R    = 6371 // Radius of the earth in km
  return R * c * 1000 // Distance in meters
}

export function fact(x: number): number {
  if ( x < 1) return 1
  return x * fact(x - 1)
}
