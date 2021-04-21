import useSWR from 'swr'
import fetcher, { httpBuildQuery } from '../utils/api-client'

const useStation = () => {
  const queryParams = {
    type: '1',
  }
  const { data, error } = useSWR(`/api/front/station/all?${httpBuildQuery(queryParams)}`, fetcher)
  console.log(data)

  return {
    stations: data?.retVal,
    isLoading: !error && !data,
    isError: error,
  }
}

export default useStation
