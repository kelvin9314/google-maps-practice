import React from 'react'
import * as R from 'ramda'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  MarkerClusterer,
  StandaloneSearchBox,
  Autocomplete,
  OverlayView,
} from '@react-google-maps/api'
import useStations from '../hooks/use-stations'
import { useImmer } from 'use-immer'
import MapInfoWIndow from '../components/MapInfoWIndow.jsx'
import { areaConfig, zoomLevelConfig, CENTER_OF_TAIWAN } from '../utils/constant'
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
import FormLabel from '@material-ui/core/FormLabel'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'

import LocationCity from '@material-ui/icons/LocationCity'

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
  // heading: 5,
  // tilt: 0,
  minZoom: zoomLevelConfig.wholeTaiwan,
}

function createKey(station) {
  return station.lat + station.lng + station.station_no
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
  const history = useHistory()
  const location = useLocation()

  const { data: rawStations, isError, isLoading } = useStations()

  const [selectedStation, setSelectedStation] = React.useState({})
  const [selectedCity, setSelectedCity] = React.useState('') // NOTE : key name of area only

  // const [selectedBikeType, setSelectedBikeType] = React.useState('1') // '1' or '2'
  const [selectedBikeType, setSelectedBikeType] = React.useState(() => {
    const params = new URLSearchParams(location.search)
    const val = params.get('bikeType')
    return ['1', '2'].includes(val) ? val : '1'
  }) // '1' or '2'
  // const selectedBikeType = React.useMemo(() => {
  //   const params = new URLSearchParams(location.search)
  //   const val = params.get('bikeType')
  //   return ['1', '2'].includes(val) ? val : '1'
  // }, [location.search]) //

  const stations = React.useMemo(() => {
    console.log('station update')
    if (selectedBikeType === '1') return rawStations.yb1 ? R.clone(rawStations.yb1) : []
    if (selectedBikeType === '2') return rawStations.yb2 ? R.clone(rawStations.yb2) : []
  }, [rawStations, selectedBikeType])

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
  const [isMarkerVisible, setIsMarkerVisible] = React.useState(false)
  const [displayInfo, setDisplayInfo] = useImmer({
    centerOfMap: CENTER_OF_TAIWAN,
  })
  const onLoadMap = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds()
    map.fitBounds(bounds)
    setMap(map)
  }, [])

  const onUnmountMap = React.useCallback(function callback(map) {
    setMap(null)
  }, [])

  const onLoadMarker = marker => {
    // console.log('marker: ', marker)
  }

  // React.useEffect(() => {
  //   // console.log(rawStations)
  //   console.log(stations)
  // }, [stations])

  React.useEffect(() => {
    if (!map) return

    // NOTE : for the center position display when Map is initialed
    if (selectedCity) {
      panToWithZoomLevel(areaConfig[selectedCity].position, zoomLevelConfig.wholeTaiwan)
    } else {
      panToWithZoomLevel(CENTER_OF_TAIWAN, zoomLevelConfig.wholeTaiwan)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedCity, selectedBikeType])

  const mapZoomLevelChecker = () => {
    if (!map) return
    console.log('zoom level: ', map.getZoom())
    // console.log(infoWindowRef)
    if (map.getZoom() >= zoomLevelConfig.wholeTaiwan) {
      setIsMarkerVisible(true)
    } else {
      setIsMarkerVisible(false)
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
      panToWithZoomLevel(latlng, zoomLevelConfig.placeSearch)
    } else {
      console.log('Autocomplete not loaded yet!')
    }
  }

  function panToWithZoomLevel(latlng, zoomLevelConfig = 16) {
    map.panTo(latlng)
    map.setZoom(zoomLevelConfig)
  }

  function selectCityChangeHandler(e) {
    const areaKey = e.target.value
    // const targetCityObj = { ...areaConfig[areaKey].position }
    setSelectedCity(areaKey)
    // panToWithZoomLevel(targetCityObj, zoomLevelConfig.cityChange)
    // setDisplayInfo(draft => {
    //   draft.centerOfMap = targetCityObj
    // })
    // map.setZoom(zoomLevelConfig.cityChange)
  }

  function stationSearchHandler(stations = [], queryString = '') {
    queryString = queryString.trim()
    if (!queryString) return

    const targetStation = searchStationByName(stations, queryString)

    if (targetStation?.lat && targetStation?.lng) {
      const latlng = { lat: Number(targetStation.lat), lng: Number(targetStation.lng) }
      panToWithZoomLevel(latlng, zoomLevelConfig.placeSearch)
      toggleInfoWindow(targetStation)
    }
  }

  function stationSelectHandler(stationObj) {
    if (!stationObj || !stationObj?.lat || !stationObj?.lng) return

    const latlng = { lat: Number(stationObj.lat), lng: Number(stationObj.lng) }
    panToWithZoomLevel(latlng, zoomLevelConfig.placeSearch)
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
      panToWithZoomLevel(latlng, zoomLevelConfig.placeSearch)
    }
  }

  const handlerOverLayOffset = ({ offsetWidth, offsetHeight, area }) => {
    // console.log(area)
    const offsetSolution = {
      goTop: {
        x: 0,
        y: -50,
      },
      goRight: {
        x: 50,
        y: 0,
      },
      goRightBottom: {
        x: 50,
        y: 50,
      },
      goBottom: {
        x: 0,
        y: 50,
      },
      goLeftBottom: {
        x: -50,
        y: 0,
      },
      goLeft: {
        x: -50,
        y: 0,
      },
    }

    if (area.areaCode === areaConfig.taipei.areaCode) return offsetSolution.goTop
    if (area.areaCode === areaConfig.tycg.areaCode) return offsetSolution.goTop

    if (area.areaCode === areaConfig.hccg.areaCode) return offsetSolution.goLeft

    if (area.areaCode === areaConfig.miaoli.areaCode) return offsetSolution.goLeftBottom
    if (area.areaCode === areaConfig.taichung.areaCode) return offsetSolution.goLeft
    if (area.areaCode === areaConfig.chiayi.areaCode) return offsetSolution.goLeft

    if (area.areaCode === areaConfig.kcg.areaCode) return offsetSolution.goTop
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
            {/* <Autocomplete
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
            </StandaloneSearchBox> */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Bike Type</FormLabel>
              <RadioGroup
                aria-label="Bike Type"
                name="Bike Type"
                value={selectedBikeType}
                onChange={e => {
                  const targetBikeType = e.target.value
                  history.replace({
                    pathname: location.pathname,
                    search: '?' + new URLSearchParams({ bikeType: e.target.value }).toString(),
                  })
                  history.go(0)
                }}
              >
                <FormControlLabel value="1" control={<Radio />} label="YouBike 1.0" />
                <FormControlLabel value="2" control={<Radio />} label="YouBike 2.0" />
              </RadioGroup>
            </FormControl>
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
            mapContainerClassName="google"
            center={displayInfo.centerOfMap}
            zoom={zoomLevelConfig.wholeTaiwan}
            options={mapOptions}
            tilt={0}
            onLoad={onLoadMap}
            onUnmount={onUnmountMap}
            onZoomChanged={mapZoomLevelChecker}
            onMouseMove={() => {
              document.getElementsByClassName('google')[0].focus()
            }}
            // onDragEnd={() => console.log('onDragEnd')}
            // onCenterChanged={() => console.log('onCenterChanged')}
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
                          visible={isMarkerVisible}
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
            {/* {!isMarkerVisible &&
              Object.keys(areaConfig).map((keyName, idx) => {
                const area = areaConfig[keyName]

                return (
                  <OverlayView
                    key={area.areaCode + area.position.lat}
                    position={area.position}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    // mapPaneName={OverlayView.FLOAT_PANE}
                    // mapPaneName={OverlayView.MARKER_LAYER}
                    getPixelPositionOffset={(offsetWidth, offsetHeight) =>
                      handlerOverLayOffset({ offsetWidth, offsetHeight, area: area })
                    }
                  >
                    <div className="map_point" onClick={() => setSelectedCity(keyName)}>
                      <div>
                        {area.name} <br />
                        1234 站
                      </div>
                    </div>
                  </OverlayView>
                )
              })} */}
          </GoogleMap>
        </div>
        <div style={{ margin: '10px 0' }}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="City-native-helper">請選縣市</InputLabel>
            <NativeSelect
              value={selectedCity}
              onChange={selectCityChangeHandler}
              inputProps={{
                name: 'City',
                id: 'City-native-helper',
              }}
            >
              <option aria-label="None" value="" />
              {Object.keys(areaConfig).map((key, idx) => {
                return (
                  <option key={areaConfig[key].position.lat + areaConfig[key].position.lng} value={key}>
                    {areaConfig[key].name}
                  </option>
                )
              })}
            </NativeSelect>
            <FormHelperText>未選預設為全台</FormHelperText>
          </FormControl>
          <label htmlFor="icon-button-file">
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="span"
              onClick={() => {
                if (selectedCity) setSelectedCity('')
                panToWithZoomLevel(CENTER_OF_TAIWAN, zoomLevelConfig.wholeTaiwan)
              }}
              alt="Go To TaiWan"
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
