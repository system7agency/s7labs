export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  '10minutemail.com',
  'getnada.com',
  'sharklasers.com',
  'trashmail.com',
  'fakeinbox.com',
  'maildrop.cc',
])

export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf('@')
  if (at === -1) return false
  const domain = email.slice(at + 1).toLowerCase()
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

// Free / personal mail providers. We require a work email so leads are
// tied to a real company. These domains aren't a fit even though they're
// not throwaway.
export const FREE_EMAIL_PROVIDERS = new Set<string>([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'yahoo.fr',
  'yahoo.de',
  'ymail.com',
  'rocketmail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'gmx.com',
  'gmx.net',
  'gmx.de',
  'mail.com',
  'mail.ru',
  'yandex.com',
  'yandex.ru',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'tutanota.com',
  'zoho.com',
  'rediffmail.com',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'naver.com',
  'hanmail.net',
  'daum.net',
])

export function isFreeEmailProvider(email: string): boolean {
  const at = email.lastIndexOf('@')
  if (at === -1) return false
  const domain = email.slice(at + 1).toLowerCase()
  return FREE_EMAIL_PROVIDERS.has(domain)
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
