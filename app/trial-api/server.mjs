import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import { Resend } from 'resend'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = Number(process.env.PORT || 8787)

const USERCHECK_API_KEY = process.env.USERCHECK_API_KEY || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_FROM = process.env.RESEND_FROM || ''
const TRIAL_XTREAM_SERVER = process.env.TRIAL_XTREAM_SERVER || ''
const TRIAL_DURATION_HOURS = Number(process.env.TRIAL_DURATION_HOURS || 24)
const APP_JWT_SECRET = process.env.APP_JWT_SECRET || 'dev-secret-change-this'

const otpStore = new Map()
/** @type {Map<string, { expiresAt: string, credentials: { serverUrl: string, username: string, password: string } }>} */
const trialByEmail = new Map()
/** @type {Map<string, { email: string, expiresAt: string }>} */
const trialByDevice = new Map()

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

function nowMs() {
  return Date.now()
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function hashToken(input) {
  return crypto.createHmac('sha256', APP_JWT_SECRET).update(input).digest('hex')
}

function buildTrialCredentials(email) {
  const short = hashToken(email).slice(0, 10)
  return {
    serverUrl: TRIAL_XTREAM_SERVER,
    username: `trial_${short}`,
    password: hashToken(`${email}_${nowMs()}`).slice(0, 12),
  }
}

async function verifyEmailWithUsercheck(email) {
  if (!USERCHECK_API_KEY) {
    // Dev fallback when key is not configured.
    return {
      valid: true,
      reason: undefined,
    }
  }

  const response = await fetch(
    `https://api.usercheck.com/email/${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${USERCHECK_API_KEY}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Email validation provider failed.')
  }

  const payload = await response.json()
  if (payload.disposable || payload.blocklisted || payload.spam) {
    return {
      valid: false,
      reason: 'Email is not eligible for free trial.',
    }
  }
  return {
    valid: true,
    reason: undefined,
  }
}

function canStartTrial(email, deviceFingerprint) {
  if (trialByEmail.has(email)) {
    return {
      canStartTrial: false,
      reason: 'Only one free trial is allowed per email.',
    }
  }
  if (trialByDevice.has(deviceFingerprint)) {
    return {
      canStartTrial: false,
      reason: 'Only one free trial is allowed per device.',
    }
  }
  return { canStartTrial: true }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/trial/status', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const deviceFingerprint = String(req.body?.deviceFingerprint || '').trim()
    if (!email || !deviceFingerprint) {
      res.status(400).json({ canStartTrial: false, reason: 'Missing fields.' })
      return
    }

    const emailCheck = await verifyEmailWithUsercheck(email)
    if (!emailCheck.valid) {
      res.json({ canStartTrial: false, reason: emailCheck.reason })
      return
    }

    const status = canStartTrial(email, deviceFingerprint)
    res.json(status)
  } catch (error) {
    res.status(500).json({
      canStartTrial: false,
      reason: error instanceof Error ? error.message : 'Status check failed.',
    })
  }
})

app.post('/api/trial/request-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) {
      res.status(400).json({ ok: false })
      return
    }

    const otp = randomOtp()
    const expiresAt = nowMs() + 10 * 60 * 1000
    otpStore.set(email, { otp, expiresAt })

    if (resend && RESEND_FROM) {
      await resend.emails.send({
        from: RESEND_FROM,
        to: [email],
        subject: 'SUPA SERVICE trial OTP',
        html: `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
      })
    } else {
      // Dev fallback when Resend is not configured.
      console.log(`[DEV OTP] ${email}: ${otp}`)
    }

    res.json({ ok: true })
  } catch {
    res.status(500).json({ ok: false })
  }
})

app.post('/api/trial/verify-otp', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const otp = String(req.body?.otp || '').trim()
  const record = otpStore.get(email)

  if (!record) {
    res.status(400).json({ verified: false })
    return
  }
  if (record.expiresAt < nowMs()) {
    otpStore.delete(email)
    res.status(400).json({ verified: false })
    return
  }
  if (record.otp !== otp) {
    res.status(400).json({ verified: false })
    return
  }

  otpStore.delete(email)
  res.json({ verified: true })
})

app.post('/api/trial/create', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const deviceFingerprint = String(req.body?.deviceFingerprint || '').trim()

    if (!email || !deviceFingerprint) {
      res.status(400).json({ error: 'Missing fields.' })
      return
    }

    const status = canStartTrial(email, deviceFingerprint)
    if (!status.canStartTrial) {
      res.status(403).json(status)
      return
    }

    if (!TRIAL_XTREAM_SERVER) {
      res.status(500).json({ error: 'TRIAL_XTREAM_SERVER is not configured.' })
      return
    }

    // Replace this with your real provisioning API call if available.
    // Expected payload format:
    // { serverUrl, username, password, expiresAt }
    let credentials = buildTrialCredentials(email)
    let expiresAt = new Date(
      nowMs() + TRIAL_DURATION_HOURS * 60 * 60 * 1000,
    ).toISOString()

    const provisionApiUrl = process.env.TRIAL_PROVISION_API_URL || ''
    if (provisionApiUrl) {
      const provisionResponse = await fetch(provisionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.TRIAL_PROVISION_API_KEY
            ? { Authorization: `Bearer ${process.env.TRIAL_PROVISION_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({
          email,
          deviceFingerprint,
          durationHours: TRIAL_DURATION_HOURS,
        }),
      })
      if (!provisionResponse.ok) {
        res.status(502).json({ error: 'Trial provisioning API failed.' })
        return
      }
      const provisioned = await provisionResponse.json()
      if (
        !provisioned?.serverUrl ||
        !provisioned?.username ||
        !provisioned?.password
      ) {
        res.status(502).json({ error: 'Provisioning API returned invalid data.' })
        return
      }
      credentials = {
        serverUrl: provisioned.serverUrl,
        username: provisioned.username,
        password: provisioned.password,
      }
      if (provisioned.expiresAt) {
        expiresAt = String(provisioned.expiresAt)
      }
    }

    trialByEmail.set(email, { expiresAt, credentials })
    trialByDevice.set(deviceFingerprint, { email, expiresAt })

    res.json({
      credentials,
      expiresAt,
    })
  } catch {
    res.status(500).json({ error: 'Trial creation failed.' })
  }
})

app.listen(PORT, () => {
  console.log(`Trial API running on http://localhost:${PORT}`)
})
