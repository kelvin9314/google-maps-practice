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
import { searchStationByName } from '../utils/station-helpers'

import MaterialAutocomplete from '@material-ui/lab/Autocomplete'
import { makeStyles } from '@material-ui/core/styles'
import {
  TextField as MaterialTextField,
  IconButton,
  FormControl,
  FormHelperText,
  InputLabel,
  NativeSelect,
} from '@material-ui/core'
import LocationCity from '@material-ui/icons/LocationCity'

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
  minZoom: 8,
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
}

const useStyles = makeStyles(theme => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}))

function Map() {
  const classes = useStyles()
  const { data: stations, isError, isLoading } = useStation()

  // const stationSuggestArr = React.useMemo(() => {
  //   const resultArr = []
  //   if (stations?.length > 0) {
  //     stations.forEach(station => resultArr.push(station.name_tw))
  //   }
  //   return resultArr
  // }, [stations])

  // console.log(stationSuggestArr)

  const [selectedStation, setSelectedStation] = React.useState({})
  const [selectedCity, setSelectedCity] = React.useState(() => Object.keys(areaCenterPosition)[0])
  console.log(selectedCity)

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
  const [searchBox, setSearchBox] = React.useState(null)
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
      const place = autoComplete.getPlace()
      console.log(place)
      if (!place.geometry) return

      const latlng = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      }
      panToWithZoomLevel(latlng, 16)
    } else {
      console.log('Autocomplete is not loaded yet!')
    }
  }

  function panToWithZoomLevel(latlng, zoomLevel = 16) {
    map.setZoom(zoomLevel)
    // const position = new window.google.maps.LatLng(latlng)
    // map.panTo(position)
    map.panTo(latlng)
  }

  function selectCityChangeHandler(e) {
    const areaKey = e.target.value
    setSelectedCity(areaKey)
    panToWithZoomLevel(areaCenterPosition[areaKey], 14)
  }

  function stationSearchHandler(stations = [], queryString = '') {
    queryString = queryString.trim()
    if (!queryString) return

    const targetStation = searchStationByName(stations, queryString)

    if (targetStation?.lat && targetStation?.lng) {
      const latlng = { lat: Number(targetStation.lat), lng: Number(targetStation.lng) }
      panToWithZoomLevel(latlng, 16)
    }
  }

  if (loadError) {
    return <div>Map cannot be loaded right now, sorry.</div>
  }

  return isLoaded ? (
    <>
      <h1>Google Maps</h1>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={areaCenterPosition[selectedCity]}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Child components, such as markers, info windows, etc. */}

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

      <div style={{ margin: '10px 0' }}>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="age-native-helper">City</InputLabel>
          <NativeSelect
            value={selectedCity}
            onChange={selectCityChangeHandler}
            inputProps={{
              name: 'age',
              id: 'age-native-helper',
            }}
          >
            {Object.keys(areaCenterPosition).map(key => (
              <option key={areaCenterPosition[key].lat + areaCenterPosition[key].lng + key}>{key}</option>
            ))}
          </NativeSelect>
          <FormHelperText>請選擇任一縣市</FormHelperText>
        </FormControl>
        <label htmlFor="icon-button-file">
          <IconButton
            color="primary"
            aria-label="upload picture"
            component="span"
            onClick={() => panToWithZoomLevel(areaCenterPosition.taichung, 14)}
            alt="Go To TaiChing"
          >
            <LocationCity />
          </IconButton>
        </label>
      </div>
      <div className="container">
        <div className="container__column">
          <Autocomplete
            className="autocomplete-list"
            onLoad={autocomplete => setAutoComplete(autocomplete)}
            onPlaceChanged={onPlaceChanged}
          >
            <MaterialTextField id="google-places-search" placeholder="請輸入地名/街名" label="Google地標 Search" />
          </Autocomplete>
          <br />
          {/* <StandaloneSearchBox
            onLoad={ref => setSearchBox(ref)}
            onPlacesChanged={() => {
              console.log(searchBox.getPlaces())
              // console.log(searchBox.getPlaces()[0].geometry.location)
            }}
          >
            <input type="text" placeholder="StandaloneSearchBox" style={inputStyle} />
          </StandaloneSearchBox> */}
        </div>
        <div className="container__column">
          <MaterialAutocomplete
            id="combo-box-demo"
            options={stations || []}
            getOptionLabel={option => option.name_tw}
            style={{ width: 300 }}
            blurOnSelect={'mouse'} // 'mouse'| 'touch'| bool
            onInputChange={(e, value) => stationSearchHandler(stations, value)}
            // onHighlightChange={(e, option, reason) => console.log(option)}
            renderInput={params => (
              <MaterialTextField {...params} label="YouBike 站點" placeholder="請輸入站點名稱" variant="outlined" />
            )}
          />
        </div>
      </div>
    </>
  ) : (
    <></>
  )
}

export default React.memo(Map)
