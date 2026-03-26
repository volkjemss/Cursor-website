import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import {
  type XtreamCategory,
  type XtreamCredentials,
  type XtreamStream,
  buildPlayableUrl,
  getLiveCategories,
  getLiveStreams,
  getProfile,
  normalizeServerUrl,
  saveProfile,
} from './lib/xtream'
import { VideoPlayer } from './components/VideoPlayer'

const DEMO_HINT_SERVER = 'http://127.0.0.1:4010'
const DEMO_HINT_USERNAME = 'demo'
const DEMO_HINT_PASSWORD = 'demo'

function App() {
  const savedProfile = getProfile()
  const [serverUrl, setServerUrl] = useState(savedProfile?.serverUrl ?? '')
  const [username, setUsername] = useState(savedProfile?.username ?? '')
  const [password, setPassword] = useState(savedProfile?.password ?? '')
  const [credentials, setCredentials] = useState<XtreamCredentials | null>(null)
  const [categories, setCategories] = useState<XtreamCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [streams, setStreams] = useState<XtreamStream[]>([])
  const [selectedStream, setSelectedStream] = useState<XtreamStream | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isLoadingStreams, setIsLoadingStreams] = useState(false)

  const playableUrl = useMemo(() => {
    if (!credentials || !selectedStream) {
      return null
    }
    return buildPlayableUrl(credentials, selectedStream)
  }, [credentials, selectedStream])

  const filteredStreams = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    if (!normalizedTerm) {
      return streams
    }

    return streams.filter((stream) =>
      stream.name.toLowerCase().includes(normalizedTerm),
    )
  }, [searchTerm, streams])

  const fetchStreams = async (
    session: XtreamCredentials,
    categoryId: string | null,
  ) => {
    setIsLoadingStreams(true)
    setStreamError(null)
    try {
      const channelList = await getLiveStreams(session, categoryId)
      setStreams(channelList)
      setSelectedStream(channelList[0] ?? null)
    } catch (error) {
      setStreams([])
      setSelectedStream(null)
      setStreamError(
        error instanceof Error
          ? error.message
          : 'Could not load channels from Xtream API.',
      )
    } finally {
      setIsLoadingStreams(false)
    }
  }

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError(null)
    setStreamError(null)
    setIsAuthenticating(true)

    try {
      const session: XtreamCredentials = {
        serverUrl: normalizeServerUrl(serverUrl),
        username: username.trim(),
        password: password.trim(),
      }
      if (!session.username || !session.password) {
        throw new Error('Username and password are required.')
      }

      const liveCategories = await getLiveCategories(session)
      const nextCategoryId = liveCategories[0]?.category_id ?? null

      setCredentials(session)
      setCategories(liveCategories)
      setSelectedCategoryId(nextCategoryId)
      saveProfile(session)
      await fetchStreams(session, nextCategoryId)
    } catch (error) {
      setCredentials(null)
      setCategories([])
      setSelectedCategoryId(null)
      setStreams([])
      setSelectedStream(null)
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Could not authenticate with Xtream Codes credentials.',
      )
    } finally {
      setIsAuthenticating(false)
    }
  }

  const onCategorySelect = async (categoryId: string) => {
    if (!credentials) {
      return
    }

    setSelectedCategoryId(categoryId)
    await fetchStreams(credentials, categoryId)
  }

  return (
    <main className="layout">
      <aside className="sidebar">
        <h1>Xtream IPTV App</h1>
        <p className="subtitle">
          Log in with Xtream Codes credentials and play live channels.
        </p>
        <p className="hint">
          For local demo: {DEMO_HINT_SERVER} / {DEMO_HINT_USERNAME} /{' '}
          {DEMO_HINT_PASSWORD}
        </p>

        <form className="login-form" onSubmit={onLogin}>
          <label>
            Server URL
            <input
              type="text"
              value={serverUrl}
              onChange={(event) => setServerUrl(event.target.value)}
              placeholder="http://your-server:port"
              autoComplete="url"
              required
            />
          </label>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={isAuthenticating}>
            {isAuthenticating ? 'Connecting...' : 'Connect'}
          </button>
        </form>

        {loginError && <p className="error">{loginError}</p>}

        <section className="categories">
          <h2>Live Categories</h2>
          {!credentials && (
            <p className="hint">Connect first to load categories.</p>
          )}
          {credentials && categories.length === 0 && (
            <p className="hint">No categories returned by provider.</p>
          )}
          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category.category_id}
                type="button"
                className={
                  selectedCategoryId === category.category_id ? 'active' : ''
                }
                onClick={() => void onCategorySelect(category.category_id)}
              >
                {category.category_name}
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className="content">
        <div className="player-section">
          <h2>{selectedStream ? selectedStream.name : 'Select a channel'}</h2>
          <VideoPlayer
            key={playableUrl ?? 'empty'}
            streamUrl={playableUrl}
            streamName={selectedStream?.name ?? 'No channel selected'}
          />
          {playableUrl && <p className="hint">Now playing: {playableUrl}</p>}
        </div>

        <div className="channels">
          <div className="channels-header">
            <h2>Channels</h2>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search channels"
            />
          </div>

          {streamError && <p className="error">{streamError}</p>}
          {isLoadingStreams && <p className="hint">Loading channels...</p>}

          <ul>
            {!isLoadingStreams &&
              filteredStreams.map((stream) => (
                <li key={stream.stream_id}>
                  <button
                    type="button"
                    className={
                      selectedStream?.stream_id === stream.stream_id
                        ? 'active'
                        : ''
                    }
                    onClick={() => setSelectedStream(stream)}
                  >
                    {stream.name}
                  </button>
                </li>
              ))}
          </ul>
          {!isLoadingStreams && filteredStreams.length === 0 && (
            <p className="hint">No channels found for this filter.</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
