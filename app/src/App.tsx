import { useEffect, useMemo, useState } from 'react'
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
import {
  checkTrialEligibility,
  createTrial,
  getTrialSession,
  requestOtp,
  verifyOtp,
} from './lib/trial'
import { scheduleTrialOfferNotifications } from './lib/offers'

function App() {
  const savedProfile = getProfile()
  const savedTrial = getTrialSession()
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
  const [activeMode, setActiveMode] = useState<'trial' | 'direct'>('trial')
  const [trialEmail, setTrialEmail] = useState('')
  const [trialOtp, setTrialOtp] = useState('')
  const [trialError, setTrialError] = useState<string | null>(null)
  const [trialMessage, setTrialMessage] = useState<string | null>(
    savedTrial
      ? `Trial active until ${new Date(savedTrial.expiresAt).toLocaleString()}`
      : null,
  )
  const [isTrialLoading, setIsTrialLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  useEffect(() => {
    const trial = getTrialSession()
    if (!trial) {
      return
    }
    void scheduleTrialOfferNotifications(trial.expiresAt)
  }, [])

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

  const connectWithCredentials = async (session: XtreamCredentials) => {
    const liveCategories = await getLiveCategories(session)
    const nextCategoryId = liveCategories[0]?.category_id ?? null

    setCredentials(session)
    setCategories(liveCategories)
    setSelectedCategoryId(nextCategoryId)
    saveProfile(session)
    await fetchStreams(session, nextCategoryId)
  }

  const onStartTrial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTrialError(null)
    setTrialMessage(null)
    setIsTrialLoading(true)

    try {
      const normalizedEmail = trialEmail.trim().toLowerCase()
      if (!normalizedEmail) {
        throw new Error('Email is required for trial access.')
      }

      const eligibility = await checkTrialEligibility(normalizedEmail)
      if (!eligibility.canStartTrial) {
        throw new Error(eligibility.reason ?? 'Trial not available.')
      }

      await requestOtp(normalizedEmail)
      setOtpSent(true)
      setTrialMessage('OTP sent to your email.')
    } catch (error) {
      setTrialError(error instanceof Error ? error.message : 'Trial start failed.')
    } finally {
      setIsTrialLoading(false)
    }
  }

  const onVerifyOtpAndStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTrialError(null)
    setTrialMessage(null)
    setIsTrialLoading(true)

    try {
      const normalizedEmail = trialEmail.trim().toLowerCase()
      await verifyOtp(normalizedEmail, trialOtp.trim())
      const trialPayload = await createTrial(normalizedEmail)
      await connectWithCredentials(trialPayload.credentials)
      setTrialMessage(
        `Trial activated until ${new Date(trialPayload.expiresAt).toLocaleString()}.`,
      )
      setOtpSent(false)
      setTrialOtp('')
    } catch (error) {
      setTrialError(
        error instanceof Error ? error.message : 'OTP verification failed.',
      )
    } finally {
      setIsTrialLoading(false)
    }
  }

  return (
    <main className="layout">
      <aside className="sidebar">
        <h1>SUPA SERVICE</h1>
        <p className="subtitle">
          IPTV app for trial users and full Xtream login.
        </p>

        <div className="mode-toggle">
          <button
            type="button"
            className={activeMode === 'trial' ? 'active' : ''}
            onClick={() => setActiveMode('trial')}
          >
            Free Trial
          </button>
          <button
            type="button"
            className={activeMode === 'direct' ? 'active' : ''}
            onClick={() => setActiveMode('direct')}
          >
            Existing Account
          </button>
        </div>

        {activeMode === 'trial' && (
          <>
            <form className="login-form" onSubmit={onStartTrial}>
              <label>
                Email address
                <input
                  type="email"
                  value={trialEmail}
                  onChange={(event) => setTrialEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>
              <button type="submit" disabled={isTrialLoading}>
                {isTrialLoading ? 'Please wait...' : 'Send OTP'}
              </button>
            </form>

            {otpSent && (
              <form className="login-form otp-form" onSubmit={onVerifyOtpAndStart}>
                <label>
                  OTP code
                  <input
                    type="text"
                    value={trialOtp}
                    onChange={(event) => setTrialOtp(event.target.value)}
                    placeholder="Enter 6-digit code"
                    inputMode="numeric"
                    required
                  />
                </label>
                <button type="submit" disabled={isTrialLoading}>
                  {isTrialLoading ? 'Activating...' : 'Activate 24h Trial'}
                </button>
              </form>
            )}
          </>
        )}

        {activeMode === 'direct' && (
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
        )}

        {loginError && <p className="error">{loginError}</p>}
        {trialError && <p className="error">{trialError}</p>}
        {trialMessage && <p className="hint">{trialMessage}</p>}

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
