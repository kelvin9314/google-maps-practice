import fetch from 'unfetch'
import Qs from 'qs'
import { Children } from 'react'

const localStorageKey = '_token_'

export default function client(endpoint, { body, ...customConfig } = {}) {
  let apiDomain = null
  if (process.env.REACT_APP_API_URL) {
    apiDomain = process.env.REACT_APP_API_URL
  } else {
    apiDomain = 'https://apis.youbike.com.tw'
  }

  const token = window.sessionStorage.getItem(localStorageKey)

  // const headers = { 'Content-Type': 'application/json' }
  // const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    // credentials: 'include',
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  }

  if (body) {
    config.body = Qs.stringify(body)
  }

  return fetch(`${apiDomain}/${endpoint}`, config).then(async response => {
    // if (response.status === 401) {
    //   window.location.assign(window.location.host)
    //   return
    // }

    const data = await response.json()
    if (response.ok) {
      return data
    } else {
      return Promise.reject(new Error(data.retMsg))
    }
  })
}

export function httpBuildQuery(obj) {
  return Qs.stringify(obj, { arrayFormat: 'brackets' })
}
