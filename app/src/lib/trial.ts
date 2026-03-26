import { Device } from '@capacitor/device'
import { type XtreamCredentials, saveProfile } from './xtream'

export type TrialStatusResponse = {
  canStartTrial: boolean
  reason?: string
}

export type RequestOtpResponse = {
  ok: boolean
}

export type VerifyOtpResponse = {
  verified: boolean
}

export type CreateTrialResponse = {
  credentials: XtreamCredentials
  expiresAt: string
}

const TRIAL_SESSION_STORAGE_KEY = 'trial_session'

type TrialSession = {
  email: string
  expiresAt: string
}

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_TRIAL_API_BASE_URL
  if (!configured || typeof configured !== 'string') {
    return 'http://localhost:8787'
  }
  return configured.replace(/\/+$/, '')
}

export async function getDeviceFingerprint(): Promise<string> {
  const info = await Device.getId()
  return info.identifier
}

export async function checkTrialEligibility(email: string): Promise<TrialStatusResponse> {
  const fingerprint = await getDeviceFingerprint()
  const url = `${getApiBaseUrl()}/api/trial/status`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      deviceFingerprint: fingerprint,
    }),
  })

  if (!response.ok) {
    throw new Error('Could not verify trial eligibility.')
  }
  return (await response.json()) as TrialStatusResponse
}

export async function requestOtp(email: string): Promise<void> {
  const url = `${getApiBaseUrl()}/api/trial/request-otp`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) {
    throw new Error('Could not send OTP.')
  }
  const payload = (await response.json()) as RequestOtpResponse
  if (!payload.ok) {
    throw new Error('OTP request failed.')
  }
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const url = `${getApiBaseUrl()}/api/trial/verify-otp`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  })

  if (!response.ok) {
    throw new Error('OTP verification failed.')
  }
  const payload = (await response.json()) as VerifyOtpResponse
  if (!payload.verified) {
    throw new Error('Invalid OTP.')
  }
}

export async function createTrial(email: string): Promise<CreateTrialResponse> {
  const fingerprint = await getDeviceFingerprint()
  const url = `${getApiBaseUrl()}/api/trial/create`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      deviceFingerprint: fingerprint,
    }),
  })

  if (!response.ok) {
    throw new Error('Could not create trial.')
  }

  const payload = (await response.json()) as CreateTrialResponse
  saveProfile(payload.credentials)
  saveTrialSession({
    email,
    expiresAt: payload.expiresAt,
  })
  return payload
}

export function saveTrialSession(session: TrialSession): void {
  localStorage.setItem(TRIAL_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function getTrialSession(): TrialSession | null {
  const raw = localStorage.getItem(TRIAL_SESSION_STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as TrialSession
    if (!parsed.email || !parsed.expiresAt) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

