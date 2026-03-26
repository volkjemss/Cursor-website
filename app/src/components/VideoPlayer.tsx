import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

type VideoPlayerProps = {
  streamUrl: string | null
  streamName: string
}

export function VideoPlayer({ streamUrl, streamName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playerError, setPlayerError] = useState<string | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !streamUrl) {
      return
    }

    setPlayerError(null)

    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = streamUrl
      void videoElement.play().catch(() => {
        setPlayerError('Autoplay blocked. Press play to start.')
      })
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
      })
      hls.loadSource(streamUrl)
      hls.attachMedia(videoElement)

      hls.on(Hls.Events.ERROR, (_eventName, data) => {
        if (data.fatal) {
          setPlayerError(`Playback error: ${data.type}`)
          hls.destroy()
        }
      })

      void videoElement.play().catch(() => {
        setPlayerError('Autoplay blocked. Press play to start.')
      })

      return () => {
        hls.destroy()
      }
    }

    videoElement.src = streamUrl
    void videoElement.play().catch(() => {
      setPlayerError('This browser cannot auto-play this stream.')
    })
  }, [streamUrl])

  if (!streamUrl) {
    return (
      <div className="empty-player">
        <p>Select a channel to start playback.</p>
      </div>
    )
  }

  return (
    <div className="video-shell">
      <video ref={videoRef} controls autoPlay playsInline className="video-player" />
      <p className="hint">Channel: {streamName}</p>
      {playerError && <p className="error">{playerError}</p>}
    </div>
  )
}
