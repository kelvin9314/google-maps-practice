import useSWR from 'swr'
import fetcher, { httpBuildQuery } from '../utils/api-client'

const useStations = () => {
  const options = {
    // refreshInterval: 1000 * 60 * 3,
    revalidateOnFocus: false,
  }

  const { data: stationYb1, errorYb1 } = useSWR('/json/station-yb1.json', fetcher, options)
  const { data: stationYb2, errorYb2 } = useSWR(`/json/station-yb2.json`, fetcher, options)

  const data = {
    yb1: stationYb1,
    yb2: stationYb2,
  }

  return {
    data,
    isLoading: !stationYb1 && !stationYb2 && !errorYb1 && !errorYb2,
    isError: errorYb1 | errorYb2,
  }
}

export default useStations
