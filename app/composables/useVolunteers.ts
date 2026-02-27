import Papa from 'papaparse'
import type { CsvRow, ImportSummary, Volunteer, VolunteerInput } from '~/utils/volunteer-types'
import { createEntityId, normalizeEmail, normalizeGroupName } from '~/utils/volunteer-helpers'
import { csvRowSchema, emailSchema, volunteerSchema } from '~/utils/volunteer-schemas'
import { useVolunteerStorage } from '~/composables/useVolunteerStorage'

export function useVolunteers() {
  const { volunteers, groups } = useVolunteerStorage()

  const selectedVolunteerIds = useState<string[]>('volunteer-selected-ids', () => [])
  const searchQuery = useState<string>('volunteer-search-query', () => '')

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
      id: createEntityId('volunteer'),
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
      const safeRow = csvRowSchema.safeParse(row as CsvRow)
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
          groupId = createEntityId('group')
          nextGroups.push({ id: groupId, name: groupName })
          groupIdByNormalizedName.set(normalizedName, groupId)
        }

        groupIds.push(groupId)
      }

      const volunteer: Volunteer = {
        id: createEntityId('volunteer'),
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
    searchQuery,
    filteredVolunteers,
    selectedVolunteerIds,
    selectedEmails,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
    toggleVolunteerSelection,
    clearSelection,
    selectAllFiltered,
    selectVolunteersByGroupIds,
    getGroupNameList,
    exportVolunteersToCsv,
    importVolunteersFromCsv
  }
}
