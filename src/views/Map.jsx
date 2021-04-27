import React from 'react'
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  MarkerClusterer,
  StandaloneSearchBox,
  Autocomplete,
} from '@react-google-maps/api'
import useStation from '../hooks/useStations'

import MapInfoWIndow from '../components/MapInfoWIndow.jsx'
import { areaCenterPosition, defaultZoom } from '../utils/constant'

const containerStyle = {
  width: '100%',
  minWidth: '320px',
  height: '33.33em',
}

const clustererOptions = {
  // averageCenter: true,
  // gridSize: 50, // default value is 60.
  // maxZoom: 20,
  imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m', // so you must have m1.png, m2.png, m3.png, m4.png, m5.png and m6.png in that folder
}

const mapOptions = {
  streetViewControl: false,
}

function createKey(station) {
  return station.lat + station.lng + station.station_id
}

const libraries = ['places']

const inputStyle = {
  boxSizing: `border-box`,
  border: `1px solid transparent`,
  width: `240px`,
  height: `32px`,
  padding: `0 12px`,
  borderRadius: `3px`,
  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
  fontSize: `14px`,
  outline: `none`,
  textOverflow: `ellipses`,
  position: 'absolute',
  top: '10px',
  right: '10px',
}

function Map() {
  const { data: stations, isError, isLoading } = useStation()
  // console.log(stations)
  const [selectedStation, setSelectedStation] = React.useState({})

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    language: 'zh-TW', // 'en', 'zh-TW', https://developers.google.com/maps/faq#languagesupport
    // version: '3',
    region: 'TW',
    libraries,
  })

  const [map, setMap] = React.useState(null)
  const [autoComplete, setAutoComplete] = React.useState(null)

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
    setSelectedStation({ ...station })
  }

  const onPlaceChanged = () => {
    if (autoComplete !== null) {
      console.log(autoComplete.getPlace())
    } else {
      console.log('Autocomplete is not loaded yet!')
    }
  }

  function panToHandler(latlng) {
    map.setZoom(12)
    map.panTo(latlng)
    // const position = new window.google.maps.LatLng(latlng)
    // map.panTo(position)
  }

  function selectChangeHandler(e) {
    const areaKey = e.target.value
    panToHandler(areaCenterPosition[areaKey])
  }

  if (loadError) {
    return <div>Map cannot be loaded right now, sorry.</div>
  }

  return isLoaded ? (
    <>
      <h1>Google Maps</h1>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={areaCenterPosition.taipei}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Child components, such as markers, info windows, etc. */}
        <StandaloneSearchBox>
          <input
            type="text"
            placeholder="Customized your placeholder"
            style={inputStyle}
            onPlacesChanged={aaa => console.log(aaa)}
          />
        </StandaloneSearchBox>

        <MapInfoWIndow stationObj={selectedStation} />
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

      <select name="menu-areas" onChange={selectChangeHandler}>
        {Object.keys(areaCenterPosition).map(key => (
          <option key={areaCenterPosition[key].lat + areaCenterPosition[key].lng}>{key}</option>
        ))}
      </select>
      <button onClick={() => panToHandler(areaCenterPosition.taichung)}> panto Button</button>

      <Autocomplete onLoad={autocomplete => setAutoComplete(autocomplete)} onPlaceChanged={() => onPlaceChanged()}>
        <input
          type="text"
          placeholder="Customized your placeholder"
          // style={{
          //   boxSizing: `border-box`,
          //   border: `1px solid transparent`,
          //   width: `240px`,
          //   height: `32px`,
          //   padding: `0 12px`,
          //   borderRadius: `3px`,
          //   boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
          //   fontSize: `14px`,
          //   outline: `none`,
          //   textOverflow: `ellipses`,
          //   position: 'absolute',
          //   left: '50%',
          //   marginLeft: '-120px',
          // }}
        />
      </Autocomplete>
    </>
  ) : (
    <></>
  )
}

export default React.memo(Map)
