import useSWR from 'swr'
import fetcher, { httpBuildQuery } from '../utils/api-client'

const useStations = () => {
  const options = {
    // refreshInterval: 1000 * 60 * 3,
    revalidateOnFocus: false,
  }

  const { data: stationYb1, errorYb1 } = useSWR('/api/front/station/all', fetcher, options)
  const { data: stationYb2, errorYb2 } = useSWR(
    `/api/front/station/all?${httpBuildQuery({ type: '2' })}`,
    fetcher,
    options
  )

  const data = {
    yb1: stationYb1?.retVal,
    yb2: stationYb2?.retVal,
  }

  return {
    data,
    isLoading: !stationYb1 && !stationYb2 && !errorYb1 && !errorYb2,
    isError: errorYb1 | errorYb2,
  }
}

export default useStations
