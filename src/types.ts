import { SetRequired } from 'type-fest'

export interface TFileData {
  version: number
  generator: 'Overpass API 0.7.59 e21c39fe'
  osm3s: {
    timestamp_osm_base: string
    copyright: string
  }
  elements: TElement[]
}

export interface TElement {
  type: 'node' | 'relation' | 'way'
  id: number
  nodes?: number[]
  tags?: Record<string, string>
  lat?: number
  lon?: number
  members?: {
    type: 'node' | 'relation' | 'way'
    ref: number
    role: 'outer'
  }[]
}

export interface TElementWithLonLat extends SetRequired<TElement, 'lon' | 'lat'> {}

export interface TOsrmResponse {
  code: 'Ok'
  routes: {
    geometry: {
      coordinates: [ number, number ][]
      type: 'LineString'
    }
    legs: {
      steps: any[]
      summary: string
      weight: number
      duration: number
      distance: number
    }[]
    weight_name: 'routability'
    weight: number
    duration: number
    distance: number
  }[]
  waypoints: {
    hint: string
    distance: number
    name: string
    location: number[]
  }[]
}

export type TNodeType =
  | 'airports'
  | 'busTerminals'
  | 'piers'
  | 'railwayStations'

export type TTwoPoints = {
  p1_lon: number,
  p1_lat: number,
  p2_lon: number,
  p2_lat: number,
}