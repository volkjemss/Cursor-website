export type XtreamCredentials = {
  serverUrl: string
  username: string
  password: string
}

export type XtreamCategory = {
  category_id: string
  category_name: string
}

export type XtreamStream = {
  stream_id: number
  name: string
  stream_icon?: string
  category_id?: string
  direct_source?: string
  container_extension?: string
}

const PROFILE_STORAGE_KEY = 'xtream_profile'

export function normalizeServerUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '')
  if (!normalized) {
    throw new Error('Server URL is required.')
  }
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error('Server URL must include http:// or https://')
  }
  return normalized
}

export function buildApiUrl(
  credentials: XtreamCredentials,
  action: string,
  categoryId?: string | null,
): string {
  const url = new URL('/player_api.php', credentials.serverUrl)
  url.searchParams.set('username', credentials.username)
  url.searchParams.set('password', credentials.password)
  url.searchParams.set('action', action)
  if (categoryId) {
    url.searchParams.set('category_id', categoryId)
  }
  return url.toString()
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Xtream API request failed with status ${response.status}.`)
  }

  const data = (await response.json()) as T
  return data
}

export async function getLiveCategories(
  credentials: XtreamCredentials,
): Promise<XtreamCategory[]> {
  const apiUrl = buildApiUrl(credentials, 'get_live_categories')
  const response = await fetch(apiUrl)
  const categories = await parseApiResponse<XtreamCategory[]>(response)

  if (!Array.isArray(categories)) {
    throw new Error('Unexpected categories payload from Xtream API.')
  }
  return categories
}

export async function getLiveStreams(
  credentials: XtreamCredentials,
  categoryId: string | null,
): Promise<XtreamStream[]> {
  const apiUrl = buildApiUrl(credentials, 'get_live_streams', categoryId)
  const response = await fetch(apiUrl)
  const streams = await parseApiResponse<XtreamStream[]>(response)

  if (!Array.isArray(streams)) {
    throw new Error('Unexpected channel payload from Xtream API.')
  }
  return streams
}

export function buildPlayableUrl(
  credentials: XtreamCredentials,
  stream: XtreamStream,
): string {
  if (stream.direct_source) {
    return stream.direct_source
  }

  const extension = stream.container_extension || 'm3u8'
  return `${credentials.serverUrl}/live/${credentials.username}/${credentials.password}/${stream.stream_id}.${extension}`
}

export function saveProfile(credentials: XtreamCredentials): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(credentials))
}

export function getProfile(): XtreamCredentials | null {
  const serialized = localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!serialized) {
    return null
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<XtreamCredentials>
    if (!parsed.serverUrl || !parsed.username || !parsed.password) {
      return null
    }
    return {
      serverUrl: parsed.serverUrl,
      username: parsed.username,
      password: parsed.password,
    }
  } catch {
    return null
  }
}
