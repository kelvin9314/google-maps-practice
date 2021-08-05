export const searchStationByName = (stations = [], queryString = '') => {
  queryString = queryString.trim()
  console.log(queryString)
  if (stations?.length <= 0 || !queryString) return null

  return stations.find(station => new RegExp(queryString, 'i').test(station.name_tw))
}

export const setStationMarkerIcon = stationObj => {
  stationObj.markerIcon =
    stationObj.type === 1
      ? 'https://img.icons8.com/doodle/30/000000/marker--v1.png'
      : 'https://img.icons8.com/office/30/000000/marker.png'

  return stationObj
}
