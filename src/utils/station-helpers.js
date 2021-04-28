export const searchStationByName = (stations = [], queryString = '') => {
  queryString = queryString.trim()
  console.log(queryString)
  if (stations?.length <= 0 || !queryString) return null

  return stations.find(station => new RegExp(queryString, 'i').test(station.name_tw))
}
