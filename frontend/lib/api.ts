import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
  withCredentials: true,
})

let accessToken: string | null = null

export const setToken = (token: string | null) => { accessToken = token }
export const getToken = () => accessToken

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = Bearer +""+${accessToken}+""
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res = await api.post('/auth/refresh')
        const token = res.data.access_token
        setToken(token)
        original.headers.Authorization = Bearer +""+${token}+""
        return api(original)
      } catch {
        setToken(null)
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)