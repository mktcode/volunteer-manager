export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeGroupName(name: string) {
  return name.trim().toLowerCase()
}

export function createEntityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
