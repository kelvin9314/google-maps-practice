import React from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import useStation from '../hooks/useStations'

const containerStyle = {
  width: '100%',
  minWidth: '970px',
  height: '33.33em',
}

// NOTE Taipei
const defaultCenter = {
  lat: 25.047924,
  lng: 121.517081,
}

function MyComponent() {
  // temp1.retVal.filter(a => a.area_code ==='00')
  const { stations, isError, isLoading } = useStation()
  console.log(stations)

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
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Child components, such as markers, info windows, etc. */}
        {stations?.length > 1 &&
          stations
            .filter(a => a.area_code === '00')
            .map(station => {
              const position = {
                lat: Number(station.lat),
                lng: Number(station.lng),
              }
              return <Marker key={station.id} onLoad={onLoadMarker} position={position} />
            })}
        <></>
      </GoogleMap>
    </>
  ) : (
    <></>
  )
}

export default React.memo(MyComponent)
