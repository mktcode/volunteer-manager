import type { Group } from '~/utils/volunteer-types'
import { createEntityId, normalizeGroupName } from '~/utils/volunteer-helpers'
import { useVolunteerStorage } from '~/composables/useVolunteerStorage'

export function useGroups() {
  const { groups, volunteers } = useVolunteerStorage()

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
      id: createEntityId('group'),
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

  return {
    groups,
    createGroup,
    renameGroup,
    deleteGroup
  }
}
