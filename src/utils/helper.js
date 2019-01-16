import axios from 'axios'

export const utf8ToB64 = (str) => {
  return window.btoa(unescape(encodeURIComponent(str)))
}

export const b64ToUtf8 = (str) => {
  return decodeURIComponent(escape(window.atob(str)))
}

export const queryParse = (search = window.location.search) => {
  if (!search) return {}
  const queryString = search[0] === '?' ? search.substring(1) : search
  const query = {}
  queryString
    .split('&')
    .forEach(queryStr => {
      const [key, value] = queryStr.split('=')
      /* istanbul ignore else */
      if (key) query[decodeURIComponent(key)] = decodeURIComponent(value)
    })

  return query
}

export const axiosJSON = axios.create({
  headers: {
    'Accept': 'application/json'
  }
})

export const axiosGithub = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/json'
  }
})