import React from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import fetch from 'unfetch'
import useSWR from 'swr'

const fetcher = url => fetch(url).then(r => r.json())

const containerStyle = {
  width: '100%',
  minWidth: '970px',
  height: '33.33em',
}

// TAG Taipei
const defaultCenter = {
  lat: 25.047924,
  lng: 121.517081,
}

const position = {
  lat: 25.047924,
  lng: 121.517081,
}

function MyComponent() {
  // ?type=2
  //
  const { data: bikeStations } = useSWR(' https://apis.youbike.com.tw/api/front/station/all', fetcher)
  console.log(bikeStations)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    language: 'zh-TW', // 'en', 'zh-TW', https://developers.google.com/maps/faq#languagesupport
    // version: '3',
  })

  const [map, setMap] = React.useState(null)

  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds()
    map.fitBounds(bounds)
    setMap(map)
  }, [])

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null)
  }, [])

  const onLoadMarker = marker => {
    console.log('marker: ', marker)
  }

  if (loadError) {
    return <div>Map cannot be loaded right now, sorry.</div>
  }

  return isLoaded ? (
    <>
      {/* <select>
        <option>English</option>
        <option>中文</option>
      </select> */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Child components, such as markers, info windows, etc. */}
        {/* {bikeStations?.retVal?.length > 1 &&
          bikeStations?.retVal.forEach(bikeStations => {
            // console.log(bikeStations)
            const { lat, lng } = bikeStations
            console.log(lat, lng)
            return <Marker onLoad={onLoadMarker} position={{ lat, lng }} />
          })} */}
        <Marker onLoad={onLoadMarker} position={position} />
        <></>
      </GoogleMap>
    </>
  ) : (
    <></>
  )
}

export default React.memo(MyComponent)
