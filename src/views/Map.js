import React from 'react'
import { GoogleMap, useJsApiLoader, Marker, MarkerClusterer } from '@react-google-maps/api'
import useStation from '../hooks/useStations'

const containerStyle = {
  width: '100%',
  minWidth: '970px',
  height: '33.33em',
}

const defaultZoom = 15

const clustererOptions = {
  // averageCenter: true,
  // gridSize: 50, // default value is 60.
  // maxZoom: 20,
  imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m', // so you must have m1.png, m2.png, m3.png, m4.png, m5.png and m6.png in that folder
}

// NOTE Taipei
const defaultCenter = {
  lat: 25.047924,
  lng: 121.517081,
}

function createKey(station) {
  return station.lat + station.lng + station.station_id
}

function Map() {
  const { data: stations, isError, isLoading } = useStation()
  // console.log(stations)

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
    // console.log('marker: ', marker)
  }

  const toggleInfoWindow = station => {
    console.log(station)
  }

  if (loadError) {
    return <div>Map cannot be loaded right now, sorry.</div>
  }

  return isLoaded ? (
    <>
      <h1>Google Maps</h1>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Child components, such as markers, info windows, etc. */}

        {stations?.length > 1 && (
          <MarkerClusterer options={clustererOptions}>
            {clusterer =>
              stations
                // .filter(a => a.area_code === '00')
                .map(station => {
                  const position = {
                    lat: Number(station.lat),
                    lng: Number(station.lng),
                  }
                  return (
                    <Marker
                      key={createKey(station)}
                      // cursor={station.name_tw}
                      title={station.name_tw}
                      onLoad={onLoadMarker}
                      icon={'https://img.icons8.com/doodle/30/000000/marker--v1.png'}
                      position={position}
                      clusterer={clusterer}
                      // animation={window.google.maps.Animation.DROP} //  BOUNCE, DROP.
                      onClick={() => toggleInfoWindow(station)}
                      // onMouseOver={() => toggleInfoWindow(station)}
                      // onMouseUp={() => console.log('onMouseUp')}
                      // onMouseOut={() => console.log('onMouseOut')}
                      onRightClick={() => console.log('onRightClick')}
                    />
                  )
                })
            }
          </MarkerClusterer>
        )}
      </GoogleMap>
    </>
  ) : (
    <></>
  )
}

export default React.memo(Map)
