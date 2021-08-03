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
import { areaCenterPosition, defaultZoom, defaultCenter } from '../utils/constant'
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

const mapStyle = {
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  height: '40vw',
  boxShadow: '0.3vw 0.4vw 0.3vw #f1f1f1',
  borderRadius: '.5rem',
  maxHeight: '500px',
}

const zoomLevel = Object.freeze({
  wholeTaiwan: 7,
  placeSearch: 16,
  cityChange: 14,
})

const CENTER_OF_TAIWAN = { lat: 23.88467, lng: 120.990465 }

const clustererOptions = {
  // averageCenter: true,
  // gridSize: 30, // default value is 60.
  maxZoom: 16,
  minimumClusterSize: 4,
  zoomOnClick: true,
  imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m', // so you must have m1.png, m2.png, m3.png, m4.png, m5.png and m6.png in that folder
  ignoreHidden: true, // 如果 marker 需要有條件設定 visible, 這邊也要打開
}

const mapOptions = {
  streetViewControl: false,
  minZoom: zoomLevel.wholeTaiwan,
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
  const infoWindowRef = React.useRef(null)
  const { data: stations, isError, isLoading } = useStation()

  const [selectedStation, setSelectedStation] = React.useState({})
  const [selectedCity, setSelectedCity] = React.useState(() => Object.keys(areaCenterPosition)[0])

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

  const [isMarkerShow, setIsMarkerShow] = React.useState(false)
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

  React.useEffect(() => {
    console.log(map)
    if (map) {
      console.log(isLoaded)
      console.log('mappppppppppppppp')
      map.setCenter(CENTER_OF_TAIWAN)
    }
  }, [map])

  const zoomLevelChecker = () => {
    if (!map) return
    console.log('zoom level: ', map.getZoom())
    console.log(infoWindowRef)
    if (map.getZoom() >= 12) {
      setIsMarkerShow(true)
    } else {
      setIsMarkerShow(false)
    }
  }

  const toggleInfoWindow = station => {
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
      panToWithZoomLevel(latlng, zoomLevel.placeSearch)
    } else {
      console.log('Autocomplete is not loaded yet!')
    }
  }

  function panToWithZoomLevel(latlng, zoomLevel = 16) {
    map.panTo(latlng)
    map.setZoom(zoomLevel)
  }

  function selectCityChangeHandler(e) {
    const areaKey = e.target.value
    console.log('city changed')
    const targetCityObj = { ...areaCenterPosition[areaKey] }
    console.log(targetCityObj)
    setSelectedCity(areaKey)
    panToWithZoomLevel(targetCityObj, zoomLevel.cityChange)
  }

  function stationSearchHandler(stations = [], queryString = '') {
    queryString = queryString.trim()
    if (!queryString) return

    const targetStation = searchStationByName(stations, queryString)

    if (targetStation?.lat && targetStation?.lng) {
      const latlng = { lat: Number(targetStation.lat), lng: Number(targetStation.lng) }
      panToWithZoomLevel(latlng, zoomLevel.placeSearch)
      toggleInfoWindow(targetStation)
    }
  }

  function stationSelectHandler(stationObj) {
    if (!stationObj || !stationObj?.lat || !stationObj?.lng) return

    const latlng = { lat: Number(stationObj.lat), lng: Number(stationObj.lng) }
    panToWithZoomLevel(latlng, zoomLevel.placeSearch)
    toggleInfoWindow(stationObj)
  }

  function searchBoxPlacesChangeHandler() {
    const places = searchBox.getPlaces()
    // console.log(places)
    if (places?.length > 0) {
      const tempPlaceLocation = places[0].geometry.location

      const latlng = {
        lat: tempPlaceLocation.lat(),
        lng: tempPlaceLocation.lng(),
      }
      panToWithZoomLevel(latlng, zoomLevel.placeSearch)
    }
  }

  if (loadError) {
    return <div>Map cannot be loaded right now, sorry.</div>
  }

  return isLoaded ? (
    <>
      <h1>Google Maps</h1>
      <div className="page-container">
        <div className="control_container">
          <div className="control_column">
            <Autocomplete
              className="autocomplete-list"
              onLoad={autocomplete => setAutoComplete(autocomplete)}
              onPlaceChanged={onPlaceChanged}
            >
              <MaterialTextField
                id="google-places-search-autocomplete"
                placeholder="請輸入地名/街名 1"
                label="Google地標 Autocomplete"
                variant="filled"
              />
            </Autocomplete>
            <br />
            <StandaloneSearchBox onLoad={ref => setSearchBox(ref)} onPlacesChanged={searchBoxPlacesChangeHandler}>
              <MaterialTextField
                id="google-places-search-standalonebox"
                placeholder="請輸入地名/街名 2"
                label="Google地標 Standalone"
                variant="outlined"
              />
            </StandaloneSearchBox>
          </div>
          <div className="control_column">
            <MaterialAutocomplete
              id="combo-box-demo"
              options={stations || []}
              getOptionLabel={option => option.name_tw}
              style={{ width: 300 }}
              blurOnSelect={true} // 'mouse'| 'touch'| bool
              // onInputChange={(e, value) => {
              //   console.log(stations)
              //   console.log(value)
              //   // stationSearchHandler(stations, value)
              // }}
              // onHighlightChange={(e, option, reason) => {
              //   console.log(option)
              // }}
              onChange={(e, value, reason) => {
                if (!value) return
                console.log('onChange')
                // console.log(value)
                stationSelectHandler(value)
              }}
              renderInput={params => (
                <MaterialTextField {...params} label="YouBike 站點" placeholder="請輸入站點名稱" variant="outlined" />
              )}
            />
          </div>
        </div>

        <div className="station-map-container">
          <GoogleMap
            // mapContainerStyle={mapStyle}
            mapContainerClassName="google"
            // center={areaCenterPosition[selectedCity]}
            center={undefined}
            // center={{ lat: 23.88467, lng: 120.990465 }}
            zoom={zoomLevel.wholeTaiwan}
            onZoomChanged={() => zoomLevelChecker()}
            options={mapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {/* Child components, such as markers, info windows, etc. */}

            <MapInfoWIndow stationObj={selectedStation} ref={infoWindowRef} />

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
                          animation={window.google.maps.Animation.DROP} //  BOUNCE, DROP.
                          onClick={() => toggleInfoWindow(station)}
                          visible={isMarkerShow}
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
        </div>
        <div style={{ margin: '10px 0' }}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="City-native-helper">City</InputLabel>
            <NativeSelect
              value={selectedCity}
              onChange={selectCityChangeHandler}
              inputProps={{
                name: 'City',
                id: 'City-native-helper',
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
              onClick={() => {
                console.log('pan to center of TW')
                panToWithZoomLevel(CENTER_OF_TAIWAN, zoomLevel.wholeTaiwan)
              }}
              alt="Go To TaiChing"
            >
              <LocationCity />
            </IconButton>
          </label>
        </div>
      </div>
    </>
  ) : (
    <></>
  )
}

export default React.memo(Map)
