import type { RemovableRef } from '@vueuse/core'
import { useLocalStorage } from '@vueuse/core'
import type { Group, StorageSchema, Volunteer } from '~/utils/volunteer-types'
import { storageSchema } from '~/utils/volunteer-schemas'

let storageRef: RemovableRef<StorageSchema> | null = null

function getStorageRef() {
  if (!storageRef) {
    storageRef = useLocalStorage<StorageSchema>('volunteer-manager', {
      volunteers: [],
      groups: []
    })

    const parsed = storageSchema.safeParse(storageRef.value)
    if (!parsed.success) {
      storageRef.value = {
        volunteers: [],
        groups: []
      }
    } else {
      storageRef.value = parsed.data
    }
  }

  return storageRef
}

export function useVolunteerStorage() {
  const storage = getStorageRef()

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

  return {
    volunteers,
    groups
  }
}
