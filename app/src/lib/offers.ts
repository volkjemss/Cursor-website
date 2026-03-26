import { LocalNotifications } from '@capacitor/local-notifications'

const OFFER_NOTIFICATIONS_KEY = 'offer_notifications_scheduled'

export async function scheduleTrialOffers(): Promise<void> {
  if (localStorage.getItem(OFFER_NOTIFICATIONS_KEY) === '1') {
    return
  }

  const permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') {
    return
  }

  const now = Date.now()
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1001,
        title: 'SUPA SERVICE Offer',
        body: 'Upgrade now and keep all channels after your trial.',
        schedule: { at: new Date(now + 60 * 60 * 1000) },
      },
      {
        id: 1002,
        title: 'Trial Ending Soon',
        body: 'Your 24h trial is running. Activate your full plan today.',
        schedule: { at: new Date(now + 23 * 60 * 60 * 1000) },
      },
    ],
  })

  localStorage.setItem(OFFER_NOTIFICATIONS_KEY, '1')
}

export async function scheduleTrialOfferNotifications(
  trialExpiresAtIso: string,
): Promise<void> {
  if (localStorage.getItem(OFFER_NOTIFICATIONS_KEY) === '1') {
    return
  }

  const permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') {
    return
  }

  const now = Date.now()
  const expiresAtMs = new Date(trialExpiresAtIso).getTime()
  const oneHourBefore = expiresAtMs - 60 * 60 * 1000
  const fifteenMinutesBefore = expiresAtMs - 15 * 60 * 1000

  const notificationCandidates = [
    {
      id: 1001,
      title: 'SUPA SERVICE Offer',
      body: 'Upgrade now and keep all channels after your trial.',
      at: new Date(now + 60 * 60 * 1000),
    },
    {
      id: 1002,
      title: 'Trial Ending Soon',
      body: 'Your trial ends in 1 hour. Activate your full plan now.',
      at: new Date(oneHourBefore),
    },
    {
      id: 1003,
      title: 'Final Reminder',
      body: 'Trial ends in 15 minutes. Continue with a paid plan.',
      at: new Date(fifteenMinutesBefore),
    },
  ]

  const notifications = notificationCandidates.filter(
    (item) => item.at.getTime() > now + 30_000,
  )

  if (notifications.length === 0) {
    return
  }

  await LocalNotifications.schedule({ notifications })
  localStorage.setItem(OFFER_NOTIFICATIONS_KEY, '1')
}
