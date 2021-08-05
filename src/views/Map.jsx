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
import fetcher from '../utils/api-client'
import { useImmer } from 'use-immer'
import MapInfoWIndow from '../components/MapInfoWIndow.jsx'
import { areaConfig, zoomLevelConfig, CENTER_OF_TAIWAN } from '../utils/constant'
import { searchStationByName, getStationMarkerIcon } from '../utils/station-helpers'

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
import useSWR from 'swr'

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
  scrollwheel: true,
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
  const { data: responseOfAreaInfo } = useSWR('api/front/area/all', fetcher, { revalidateOnFocus: false })
  const { data: responseOfStationCount } = useSWR('api/front/station/count', fetcher, { revalidateOnFocus: false })

  const [selectedStation, setSelectedStation] = React.useState({})
  const [selectedCity, setSelectedCity] = React.useState('') // NOTE : key name of area only

  const selectedBikeType = React.useMemo(() => {
    const params = new URLSearchParams(location.search)
    const val = params.get('bike_type')
    if (['1', '2'].includes(val)) return val

    // NOTE : 預設是 1.0
    return '1'
  }, [location.search])

  const { stationAll, stationByBikeType } = React.useMemo(() => {
    const yb1 = rawStations.yb1 ? R.clone(rawStations.yb1) : []
    const yb2 = rawStations.yb2 ? R.clone(rawStations.yb2) : []

    const processingData = s => {
      return {
        ...s,
        markerIcon: getStationMarkerIcon(s),
      }
    }
    const stationAll = R.map(processingData, R.concat(yb1, yb2))
    const stationByBikeType = R.map(processingData, selectedBikeType === '1' ? yb1 : yb2)

    return { stationAll, stationByBikeType }
  }, [rawStations, selectedBikeType])

  const currentAreaByBikeTypeArr = React.useMemo(() => {
    if (!responseOfAreaInfo || !responseOfStationCount) return []

    const { retVal: infos, retMsg: infoMsg } = responseOfAreaInfo
    const { retVal: counts, retMsg: countMsg } = responseOfStationCount
    if (!infos || infos?.length === 0) {
      console.error(infos)
      return []
    }
    if (!counts || counts?.length === 0) {
      console.error(countMsg)
      return []
    }

    const isCurrentBikeType = a => a.bike_type.includes(selectedBikeType)

    const processingData = a => {
      const areaCount = counts.find(c => c.area_code === a.area_code)
      return {
        areaCode: a.area_code,
        name: a.area_name_tw,
        position: {
          lat: selectedBikeType === '1' ? Number(a.lat) : Number(a.lat2),
          lng: selectedBikeType === '1' ? Number(a.lng) : Number(a.lng2),
        },
        keyNameF2E: Object.keys(areaConfig).find(key => (areaConfig[key].areaCode === a.area_code ? key : '')),
        stationAmount: !areaCount ? 0 : selectedBikeType === '1' ? areaCount.yb1 : areaCount.yb2,
      }
    }
    const filteredAreas = R.map(processingData, R.filter(isCurrentBikeType, infos))

    return filteredAreas
  }, [responseOfAreaInfo, selectedBikeType, responseOfStationCount])

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

  React.useEffect(() => {
    if (!map) return

    // NOTE : for the center position display when Map is initialed
    if (selectedCity) {
      panToWithZoomLevel(areaConfig[selectedCity].position, zoomLevelConfig.cityChange)
    } else {
      panToWithZoomLevel(CENTER_OF_TAIWAN, zoomLevelConfig.wholeTaiwan)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedCity])

  const mapZoomLevelChecker = () => {
    if (!map) return
    console.log('zoom level: ', map.getZoom())
    // console.log(infoWindowRef)
    if (map.getZoom() >= zoomLevelConfig.markerShow) {
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
    setSelectedCity(areaKey)
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

  const setQueryParamsInSamePage = obj => {
    history.push({
      pathname: location.pathname,
      search: '?' + new URLSearchParams(obj).toString(),
    })
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
                  setQueryParamsInSamePage({ bike_type: e.target.value })
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
              options={stationByBikeType || []}
              getOptionLabel={option => option.name_tw}
              style={{ width: 300 }}
              // autoHighlight={true}
              // clearOnBlur={true}
              // clearOnEscape={true}
              blurOnSelect={true} // 'mouse'| 'touch'| bool
              // onInputChange={(e, value) => {
              //   console.log(value)
              // }}
              // onHighlightChange={(e, option, reason) => {
              //   console.log(option)
              // }}
              onChange={(e, value, reason) => {
                if (!value) return
                stationSelectHandler(value)
              }}
              renderInput={params => (
                <MaterialTextField
                  {...params}
                  label="YouBike 站點(Autocomplete)"
                  placeholder="請輸入站點名稱"
                  variant="outlined"
                />
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
            // onMouseMove={() => console.log('onMouseMove map')}
            // onDragEnd={() => console.log('onDragEnd')}
            // onCenterChanged={() => console.log('onCenterChanged')}
          >
            {/* Child components, such as markers, info windows, etc. */}

            <MapInfoWIndow stationObj={selectedStation} ref={infoWindowRef} />

            {stationAll?.length > 0 && (
              <MarkerClusterer options={clustererOptions}>
                {clusterer =>
                  stationAll.map(station => {
                    const position = {
                      lat: Number(station.lat),
                      lng: Number(station.lng),
                    }
                    return (
                      <Marker
                        key={createKey(station)}
                        cursor={station.name_tw}
                        title={station.name_tw}
                        onLoad={onLoadMarker}
                        icon={station.markerIcon}
                        position={position}
                        clusterer={clusterer}
                        animation={window.google.maps.Animation.DROP} //  BOUNCE, DROP.
                        onClick={() => toggleInfoWindow(station)}
                        visible={isMarkerVisible && station.type.toString() === selectedBikeType}
                        // onMouseOver={() => toggleInfoWindow(station)}
                        // onMouseUp={() => console.log('onMouseUp')}
                        // onMouseOut={() => console.log('onMouseOut')}
                        onRightClick={() => {
                          const param = new URLSearchParams({
                            api: 1,
                            query: `${station.lat},${station.lng}`,
                          }).toString()
                          const url = `https://www.google.com/maps/search/?${param}`
                          window.open(url, '_YouBike_station')
                        }}
                      />
                    )
                  })
                }
              </MarkerClusterer>
            )}
            {!isMarkerVisible &&
              currentAreaByBikeTypeArr.map(area => {
                return (
                  <OverlayView
                    key={area.areaCode + area.position.lat}
                    position={area.position}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    // mapPaneName={OverlayView.FLOAT_PANE}
                    // mapPaneName={OverlayView.MARKER_LAYER}
                    // getPixelPositionOffset={(offsetWidth, offsetHeight) =>
                    //   handlerOverLayOffset({ offsetWidth, offsetHeight, area: area })
                    // }
                  >
                    <div className="map_point" onClick={() => setSelectedCity(area.keyNameF2E)}>
                      <div>
                        {area.name} <br />
                        {area.stationAmount} 站
                      </div>
                    </div>
                  </OverlayView>
                )
              })}
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
