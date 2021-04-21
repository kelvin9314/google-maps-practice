import useSWR from 'swr'
import fetcher, { httpBuildQuery } from '../utils/api-client'

const useStation = () => {
  const options = {
    refreshInterval: 1000 * 60,
  }

  const queryParams = {
    type: '1',
  }
  const { data, error } = useSWR(`/api/front/station/all?${httpBuildQuery(queryParams)}`, fetcher, options)
  console.log(data)

  return {
    data: data?.retVal,
    isLoading: !error && !data,
    isError: error,
  }
}

export default useStation
