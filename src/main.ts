import {
  TElementWithLonLat,
  TFileData,
  TNodeType,
  TOsrmResponse,
  TTwoPoints,
} from './types'
import fs from 'fs'
import axios from 'axios'
import {
  fact,
  pointsDistanceMeters,
} from './utils'
import { createClient } from 'redis'
import {
  isArray,
  meanBy,
  sumBy,
} from 'lodash'

const redisClient = createClient()

class CityData {
  airports: TElementWithLonLat[]        = []
  busTerminals: TElementWithLonLat[]    = []
  piers: TElementWithLonLat[]           = []
  railwayStations: TElementWithLonLat[] = []

  constructor(
    public cityName: 'kazan' | 'moscow' | 'petersburg' | 'volgograd',
  ) {
    this.airports = this.readElements(`osrm_json_data/airports_${ cityName }.json`)
    console.log(`${ cityName }: read ${ this.airports.length } airports`)
    this.busTerminals = this.readElements(`osrm_json_data/bus_terminals_${ cityName }.json`)
    console.log(`${ cityName }: read ${ this.busTerminals.length } busTerminals`)
    this.piers = this.readElements(`osrm_json_data/piers_${ cityName }.json`)
    console.log(`${ cityName }: read ${ this.piers.length } piers`)
    this.railwayStations = this.readElements(`osrm_json_data/railway_stations_${ cityName }.json`)
    console.log(`${ cityName }: read ${ this.railwayStations.length } railwayStations`)

    console.log(`${ cityName }: TOTAL ${
      this.airports.length + this.busTerminals.length + this.piers.length + this.railwayStations.length
    } elements`)
  }

  private readElements(fileName: string): TElementWithLonLat[] {
    const fileText   = fs.readFileSync(fileName, { encoding: 'utf-8' }).toString()
    const fileObject = JSON.parse(fileText) as TFileData

    return (fileObject.elements
      .filter(element => 'lon' in element && 'lat' in element) as TElementWithLonLat[])
      .reduce<TElementWithLonLat[]>((rez, el1) => {
        if ( rez.every(el2 => {
          const twoPoints = {
            p1_lat: el1.lat,
            p1_lon: el1.lon,
            p2_lat: el2.lat,
            p2_lon: el2.lon,
          }
          return pointsDistanceMeters(twoPoints) >= 500
        }) || rez.length === 0 )
          return [ ...rez, el1 ]
        return rez
      }, [])
  }

  public async calc(...types: (TNodeType | 'all')[]) {
    const nodes: TElementWithLonLat[] = []

    types.sort()

    if ( types.includes('all') || types.includes('piers') )
      nodes.push(...this.piers)
    if ( types.includes('all') || types.includes('airports') )
      nodes.push(...this.airports)
    if ( types.includes('all') || types.includes('railwayStations') )
      nodes.push(...this.railwayStations)
    if ( types.includes('all') || types.includes('busTerminals') )
      nodes.push(...this.busTerminals)

    console.log(`START ${ isArray(types) ? types.join(' ') : types } nodes of ${ this.cityName }`)
    const total   = Math.round(fact(nodes.length) / (fact(nodes.length - 2) * fact(2)))
    let processed = 0

    const mem = await redisClient.get([ this.cityName, ...types ].join(';'))

    const rezArray: TOsrmResponse[] = mem ? JSON.parse(mem) : []
    if ( rezArray.length === 0 )
      for ( let i = 0; i < nodes.length - 1; ++i )
        for ( let j = i + 1; j < nodes.length; ++j ) {
          const twoPoints: TTwoPoints = {
            p1_lon: nodes[i].lon,
            p1_lat: nodes[i].lat,
            p2_lon: nodes[j].lon,
            p2_lat: nodes[j].lat,
          }

          rezArray.push(await CityData.getDrivingDistanceAndTime(twoPoints))

          ++processed
          if ( processed % 500 === 0 )
            console.log(`${ (Math.round(processed / total * 10000) / 100) }%: ${ i } / ${ nodes.length - 2 }, ${ j }/${ nodes.length - 1 }`)
        }
    if ( !mem ) await redisClient.set([ this.cityName, ...types ].join(';'), JSON.stringify(rezArray))
    console.log(`FINISHED ${ isArray(types) ? types.join(' ') : types } nodes of ${ this.cityName }`)


    fs.mkdirSync('result', { recursive: true })
    fs.writeFileSync(
      `result/data_${ [ this.cityName, ...types ].join('-') }.json`,
      JSON.stringify(
        rezArray.map(el => ({
          distance: el.routes[0].distance,
          duration: el.routes[0].duration,
        }))
        , null, 2),
    )


    const sumDistance = sumBy(rezArray, el => el.routes[0].distance)
    const sumDuration = sumBy(rezArray, el => el.routes[0].duration)
    const avgDistance = sumDistance / rezArray.length
    // const avgDuration = meanBy(rezArray, el => el.routes.at(0)!.duration)
    const avgDuration = sumDuration / rezArray.length

    return {
      // in meters
      sumDistance,
      avgDistance,
      // in seconds
      sumDuration,
      avgDuration,
      // kilometers per hour
      avgSpeed: (avgDistance / avgDuration) * 3.6,
    }
  }


  public static getDrivingDistanceAndTime = async ({ p1_lon, p1_lat, p2_lon, p2_lat }: TTwoPoints): Promise<TOsrmResponse> => {
    const url = `http://localhost:5000/route/v1/car/${ p1_lon },${ p1_lat };${ p2_lon },${ p2_lat }?geometries=geojson`

    const mem: string | null  = await redisClient.get(url)
    const data: TOsrmResponse = mem ? JSON.parse(mem) : await (async () => {
      let { data } = (await axios.get(url))
      void await redisClient.set(url, JSON.stringify(data))
      return data
    })()

    // return {
    //   distance: data.routes[0].distance,
    //   duration: data.routes[0].duration,
    // }
    return data
  }
}


const main = async () => {
  await redisClient.connect()

  const kazanData      = new CityData('kazan')
  const moscowData     = new CityData('moscow')
  const petersburgData = new CityData('petersburg')
  const volgogradData  = new CityData('volgograd')

  fs.mkdirSync('result', { recursive: true })
  fs.writeFileSync('result/data.json', JSON.stringify({
    // kazanAll: await kazanData.calc('all'),
    // petersburgAll: await petersburgData.calc('all'),
    // volgogradAll: await volgogradData.calc('all'),
    // kazanRailwaysAndBus: await kazanData.calc('railwayStations', 'busTerminals'),

    kazanAirports: await kazanData.calc('airports'),
    kazanBuses: await kazanData.calc('busTerminals'),
    kazanPiers: await kazanData.calc('piers'),
    kazanRailways: await kazanData.calc('railwayStations'),

    moscowAirports: await moscowData.calc('airports'),
    moscowBuses: await moscowData.calc('busTerminals'),
    moscowPiers: await moscowData.calc('piers'),
    moscowRailways: await moscowData.calc('railwayStations'),

    petersburgAirports: await petersburgData.calc('airports'),
    petersburgBuses: await petersburgData.calc('busTerminals'),
    petersburgPiers: await petersburgData.calc('piers'),
    petersburgRailways: await petersburgData.calc('railwayStations'),

    volgogradAirports: await volgogradData.calc('airports'),
    volgogradBuses: await volgogradData.calc('busTerminals'),
    volgogradPiers: await volgogradData.calc('piers'),
    volgogradRailways: await volgogradData.calc('railwayStations'),

    // moscowAirportsAndBuses: await moscowData.calc('airports', 'busTerminals'),
    // moscowAirportsAndPiers: await moscowData.calc('airports', 'piers'),
    // moscowAirportsAndRailways: await moscowData.calc('airports', 'railwayStations'),
    // moscowBusesAndPiers: await moscowData.calc('busTerminals', 'piers'),
    // moscowBusesAndRailways: await moscowData.calc('busTerminals', 'railwayStations'),
    // moscowPiersAndRailways: await moscowData.calc('piers', 'railwayStations'),
  }, null, 4))

  await redisClient.disconnect()
  process.exit(0)
}

void main()