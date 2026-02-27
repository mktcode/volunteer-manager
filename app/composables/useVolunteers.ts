import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import Papa from 'papaparse'
import { z } from 'zod'

const emailSchema = z.string().trim().email()

const volunteerSchema = z.object({
  id: z.string().min(1),
  firstname: z.string().trim().min(1),
  lastname: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim(),
  groups: z.array(z.string()),
  notes: z.string().trim()
})

const groupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1)
})

const storageSchema = z.object({
  volunteers: z.array(volunteerSchema),
  groups: z.array(groupSchema)
})

const csvRowSchema = z.object({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  groups: z.string().optional(),
  notes: z.string().optional()
})

export type Volunteer = z.infer<typeof volunteerSchema>
export type Group = z.infer<typeof groupSchema>
export type StorageSchema = z.infer<typeof storageSchema>

export interface VolunteerInput {
  firstname: string
  lastname: string
  email: string
  phone?: string
  groups?: string[]
  notes?: string
}

export interface ImportSummary {
  imported: number
  skipped: number
  errors: string[]
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeGroupName(name: string) {
  return name.trim().toLowerCase()
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useVolunteers() {
  const storage = useLocalStorage<StorageSchema>('volunteer-manager', {
    volunteers: [],
    groups: []
  })

  const parsedStorage = storageSchema.safeParse(storage.value)
  if (!parsedStorage.success) {
    storage.value = {
      volunteers: [],
      groups: []
    }
  }

  const selectedVolunteerIds = ref<string[]>([])
  const searchQuery = ref('')

  const volunteers = computed({
    get: () => storage.value.volunteers,
    set: (nextVolunteers: Volunteer[]) => {
      storage.value = {
        ...storage.value,
        volunteers: nextVolunteers
      }
    }
  })

  const groups = computed({
    get: () => storage.value.groups,
    set: (nextGroups: Group[]) => {
      storage.value = {
        ...storage.value,
        groups: nextGroups
      }
    }
  })

  const groupsById = computed(() => {
    return new Map(groups.value.map(group => [group.id, group]))
  })

  const filteredVolunteers = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) {
      return volunteers.value
    }

    return volunteers.value.filter((volunteer) => {
      return [
        volunteer.firstname,
        volunteer.lastname,
        volunteer.email,
        volunteer.notes
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  })

  const selectedEmails = computed(() => {
    const selectedIdSet = new Set(selectedVolunteerIds.value)
    const seen = new Set<string>()
    const emails: string[] = []

    for (const volunteer of volunteers.value) {
      if (!selectedIdSet.has(volunteer.id)) {
        continue
      }

      const email = volunteer.email.trim()
      const normalized = normalizeEmail(email)
      if (!email || seen.has(normalized)) {
        continue
      }

      seen.add(normalized)
      emails.push(email)
    }

    return emails.join(', ')
  })

  function isEmailUnique(email: string, exceptVolunteerId?: string) {
    const normalized = normalizeEmail(email)

    return !volunteers.value.some((volunteer) => {
      if (exceptVolunteerId && volunteer.id === exceptVolunteerId) {
        return false
      }

      return normalizeEmail(volunteer.email) === normalized
    })
  }

  function sanitizeVolunteerInput(input: VolunteerInput) {
    return {
      firstname: input.firstname.trim(),
      lastname: input.lastname.trim(),
      email: input.email.trim(),
      phone: (input.phone || '').trim(),
      groups: [...new Set((input.groups || []).filter(Boolean))],
      notes: (input.notes || '').trim()
    }
  }

  function createVolunteer(input: VolunteerInput) {
    const payload = sanitizeVolunteerInput(input)

    if (!payload.firstname || !payload.lastname) {
      return { ok: false as const, error: 'Vorname und Nachname sind erforderlich.' }
    }

    if (!emailSchema.safeParse(payload.email).success) {
      return { ok: false as const, error: 'Die E-Mail-Adresse ist ungültig.' }
    }

    if (!isEmailUnique(payload.email)) {
      return { ok: false as const, error: 'Die E-Mail-Adresse ist bereits vorhanden.' }
    }

    const volunteer: Volunteer = {
      id: createId('volunteer'),
      ...payload
    }

    volunteers.value = [...volunteers.value, volunteer]

    return { ok: true as const, volunteer }
  }

  function updateVolunteer(id: string, input: VolunteerInput) {
    const payload = sanitizeVolunteerInput(input)

    if (!payload.firstname || !payload.lastname) {
      return { ok: false as const, error: 'Vorname und Nachname sind erforderlich.' }
    }

    if (!emailSchema.safeParse(payload.email).success) {
      return { ok: false as const, error: 'Die E-Mail-Adresse ist ungültig.' }
    }

    if (!isEmailUnique(payload.email, id)) {
      return { ok: false as const, error: 'Die E-Mail-Adresse ist bereits vorhanden.' }
    }

    let didUpdate = false

    volunteers.value = volunteers.value.map((volunteer) => {
      if (volunteer.id !== id) {
        return volunteer
      }

      didUpdate = true
      return {
        ...volunteer,
        ...payload
      }
    })

    if (!didUpdate) {
      return { ok: false as const, error: 'Eintrag nicht gefunden.' }
    }

    return { ok: true as const }
  }

  function deleteVolunteer(id: string) {
    volunteers.value = volunteers.value.filter(volunteer => volunteer.id !== id)
    selectedVolunteerIds.value = selectedVolunteerIds.value.filter(selectedId => selectedId !== id)
  }

  function createGroup(name: string) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return { ok: false as const, error: 'Gruppenname ist erforderlich.' }
    }

    const normalized = normalizeGroupName(trimmedName)
    if (groups.value.some(group => normalizeGroupName(group.name) === normalized)) {
      return { ok: false as const, error: 'Die Gruppe existiert bereits.' }
    }

    const group: Group = {
      id: createId('group'),
      name: trimmedName
    }

    groups.value = [...groups.value, group]

    return { ok: true as const, group }
  }

  function renameGroup(id: string, name: string) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return { ok: false as const, error: 'Gruppenname ist erforderlich.' }
    }

    const normalized = normalizeGroupName(trimmedName)
    if (groups.value.some(group => group.id !== id && normalizeGroupName(group.name) === normalized)) {
      return { ok: false as const, error: 'Die Gruppe existiert bereits.' }
    }

    let didUpdate = false

    groups.value = groups.value.map((group) => {
      if (group.id !== id) {
        return group
      }

      didUpdate = true
      return {
        ...group,
        name: trimmedName
      }
    })

    if (!didUpdate) {
      return { ok: false as const, error: 'Gruppe nicht gefunden.' }
    }

    return { ok: true as const }
  }

  function deleteGroup(id: string) {
    groups.value = groups.value.filter(group => group.id !== id)

    volunteers.value = volunteers.value.map((volunteer) => {
      return {
        ...volunteer,
        groups: volunteer.groups.filter(groupId => groupId !== id)
      }
    })
  }

  function toggleVolunteerSelection(id: string) {
    if (selectedVolunteerIds.value.includes(id)) {
      selectedVolunteerIds.value = selectedVolunteerIds.value.filter(currentId => currentId !== id)
      return
    }

    selectedVolunteerIds.value = [...selectedVolunteerIds.value, id]
  }

  function clearSelection() {
    selectedVolunteerIds.value = []
  }

  function selectAllFiltered() {
    selectedVolunteerIds.value = filteredVolunteers.value.map(volunteer => volunteer.id)
  }

  function selectVolunteersByGroupIds(groupIds: string[]) {
    const selectedGroupIds = new Set(groupIds)

    selectedVolunteerIds.value = volunteers.value
      .filter(volunteer => volunteer.groups.some(groupId => selectedGroupIds.has(groupId)))
      .map(volunteer => volunteer.id)
  }

  function getGroupNameList(groupIds: string[]) {
    return groupIds
      .map(groupId => groupsById.value.get(groupId)?.name)
      .filter((value): value is string => Boolean(value))
  }

  function exportVolunteersToCsv() {
    const rows = volunteers.value.map((volunteer) => {
      return {
        firstname: volunteer.firstname,
        lastname: volunteer.lastname,
        email: volunteer.email,
        phone: volunteer.phone,
        groups: getGroupNameList(volunteer.groups).join(','),
        notes: volunteer.notes
      }
    })

    return Papa.unparse(rows)
  }

  function importVolunteersFromCsv(csvContent: string): ImportSummary {
    const result = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true
    })

    const errors: string[] = []
    let imported = 0
    let skipped = 0

    const nextGroups = [...groups.value]
    const nextVolunteers = [...volunteers.value]

    const groupIdByNormalizedName = new Map<string, string>()
    for (const group of nextGroups) {
      groupIdByNormalizedName.set(normalizeGroupName(group.name), group.id)
    }

    const usedEmails = new Set(nextVolunteers.map(volunteer => normalizeEmail(volunteer.email)))

    for (const [index, row] of result.data.entries()) {
      const safeRow = csvRowSchema.safeParse(row)
      if (!safeRow.success) {
        skipped += 1
        errors.push(`Zeile ${index + 2}: Ungültige Struktur.`)
        continue
      }

      const firstname = (safeRow.data.firstname || '').trim()
      const lastname = (safeRow.data.lastname || '').trim()
      const email = (safeRow.data.email || '').trim()
      const phone = (safeRow.data.phone || '').trim()
      const notes = (safeRow.data.notes || '').trim()
      const groupNames = (safeRow.data.groups || '')
        .split(',')
        .map(name => name.trim())
        .filter(Boolean)

      if (!firstname || !lastname || !email) {
        skipped += 1
        errors.push(`Zeile ${index + 2}: Pflichtfelder fehlen.`)
        continue
      }

      if (!emailSchema.safeParse(email).success) {
        skipped += 1
        errors.push(`Zeile ${index + 2}: E-Mail ist ungültig.`)
        continue
      }

      const normalizedEmail = normalizeEmail(email)
      if (usedEmails.has(normalizedEmail)) {
        skipped += 1
        errors.push(`Zeile ${index + 2}: E-Mail bereits vorhanden.`)
        continue
      }

      const groupIds: string[] = []
      for (const groupName of groupNames) {
        const normalizedName = normalizeGroupName(groupName)
        let groupId = groupIdByNormalizedName.get(normalizedName)

        if (!groupId) {
          groupId = createId('group')
          nextGroups.push({ id: groupId, name: groupName })
          groupIdByNormalizedName.set(normalizedName, groupId)
        }

        groupIds.push(groupId)
      }

      const volunteer: Volunteer = {
        id: createId('volunteer'),
        firstname,
        lastname,
        email,
        phone,
        notes,
        groups: [...new Set(groupIds)]
      }

      const validVolunteer = volunteerSchema.safeParse(volunteer)
      if (!validVolunteer.success) {
        skipped += 1
        errors.push(`Zeile ${index + 2}: Datensatz ungültig.`)
        continue
      }

      nextVolunteers.push(validVolunteer.data)
      usedEmails.add(normalizedEmail)
      imported += 1
    }

    groups.value = nextGroups
    volunteers.value = nextVolunteers

    return {
      imported,
      skipped,
      errors
    }
  }

  return {
    volunteers,
    groups,
    selectedVolunteerIds,
    searchQuery,
    filteredVolunteers,
    selectedEmails,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
    createGroup,
    renameGroup,
    deleteGroup,
    toggleVolunteerSelection,
    clearSelection,
    selectAllFiltered,
    selectVolunteersByGroupIds,
    exportVolunteersToCsv,
    importVolunteersFromCsv,
    getGroupNameList
  }
}
