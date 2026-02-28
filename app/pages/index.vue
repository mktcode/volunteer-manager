<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { ImportSummary, GroupOption, VolunteerRow, VolunteerInput } from '~/utils/volunteer-types'

useHead({
  title: 'Freiwilligenverwaltung'
})

const toast = useToast()

const {
  groups,
  createGroup,
  renameGroup,
  deleteGroup
} = useGroups()

const {
  volunteers,
  searchQuery,
  availabilityFilter,
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
  exportVolunteersToCsv,
  importVolunteersFromCsv,
  getGroupNameList
} = useVolunteers()

const groupOptions = computed<GroupOption[]>(() => {
  return groups.value.map(group => ({
    label: group.name,
    value: group.id
  }))
})

function formatAvailabilitySlot(morning: boolean, afternoon: boolean) {
  if (morning && afternoon) {
    return 'vormittags/nachmittags'
  }

  if (morning) {
    return 'vormittags'
  }

  if (afternoon) {
    return 'nachmittags'
  }

  return ''
}

function formatAvailability(volunteer: Pick<VolunteerRow, 'availability'>) {
  const sections = [
    { label: 'einmalig', key: 'oneTime' },
    { label: 'wöchentlich', key: 'recurringWeekly' },
    { label: 'monatlich', key: 'recurringMonthly' },
    { label: 'projektbezogen', key: 'projectBased' }
  ] as const

  const textParts: string[] = []

  for (const section of sections) {
    const period = volunteer.availability[section.key]
    const moFr = formatAvailabilitySlot(period.moFrMorning, period.moFrAfternoon)
    const saturday = formatAvailabilitySlot(period.saturdayMorning, period.saturdayAfternoon)
    const dayParts = [
      moFr ? `Mo-Fr ${moFr}` : '',
      saturday ? `Sa ${saturday}` : ''
    ].filter(Boolean)

    if (!dayParts.length) {
      continue
    }

    textParts.push(`${section.label}: ${dayParts.join(' | ')}`)
  }

  return textParts.join('; ')
}

const tableRows = computed<VolunteerRow[]>(() => {
  return filteredVolunteers.value.map(volunteer => ({
    ...volunteer,
    groupsText: getGroupNameList(volunteer.groups).join(', '),
    availabilityText: formatAvailability(volunteer)
  }))
})

const groupError = ref('')

const isVolunteerModalOpen = ref(false)
const isAvailabilityFilterModalOpen = ref(false)
const isGroupManagementModalOpen = ref(false)
const editingVolunteerId = ref<string | null>(null)
const volunteerError = ref('')

const editingVolunteer = computed(() => {
  if (!editingVolunteerId.value) {
    return null
  }

  return volunteers.value.find(volunteer => volunteer.id === editingVolunteerId.value) || null
})

const importSummary = ref<ImportSummary | null>(null)

const { copy, copied, isSupported } = useClipboard({ legacy: true })

function openCreateVolunteerModal() {
  editingVolunteerId.value = null
  volunteerError.value = ''
  isVolunteerModalOpen.value = true
}

function openAvailabilityFilterModal() {
  isAvailabilityFilterModalOpen.value = true
}

function openGroupManagementModal() {
  isGroupManagementModalOpen.value = true
}

function openEditVolunteerModal(id: string) {
  editingVolunteerId.value = id
  volunteerError.value = ''
  isVolunteerModalOpen.value = true
}

function onSaveVolunteer(payload: VolunteerInput) {
  if (editingVolunteerId.value) {
    const result = updateVolunteer(editingVolunteerId.value, payload)
    if (!result.ok) {
      volunteerError.value = result.error
      return
    }
  } else {
    const result = createVolunteer(payload)
    if (!result.ok) {
      volunteerError.value = result.error
      return
    }
  }

  volunteerError.value = ''
  isVolunteerModalOpen.value = false
}

function removeVolunteerWithConfirm(id: string) {
  if (!window.confirm('Soll dieser Eintrag wirklich gelöscht werden?')) {
    return
  }

  deleteVolunteer(id)
}

function onCreateGroup(name: string) {
  const result = createGroup(name)
  groupError.value = result.ok ? '' : result.error
}

function onRenameGroup(payload: { id: string, name: string }) {
  const result = renameGroup(payload.id, payload.name)
  groupError.value = result.ok ? '' : result.error
}

function removeGroupWithConfirm(id: string) {
  if (!window.confirm('Soll diese Gruppe wirklich gelöscht werden? Personen in dieser Gruppe werden dadurch nicht gelöscht, verlieren aber die Gruppenzuordnung.')) {
    return
  }

  deleteGroup(id)
}

async function copySelectedEmails() {
  if (!selectedEmails.value) {
    return
  }

  await copy(selectedEmails.value)
}

function onSelectByGroups(groupIds: string[]) {
  selectVolunteersByGroupIds(groupIds)
}

async function onImportFile(file: File) {
  const content = await file.text()
  importSummary.value = importVolunteersFromCsv(content)

  if (importSummary.value.imported > 0) {
    toast.add({
      title: 'Import abgeschlossen',
      description: `${importSummary.value.imported} Einträge importiert.`,
      color: 'success'
    })
  }
}

function exportCsv() {
  const csvContent = exportVolunteersToCsv()
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const link = document.createElement('a')
  link.href = url
  link.download = `freiwillige-helfer-osnabrueck-${today}-${hours}-${minutes}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 bg-white shadow-2xl shadow-black/5 min-h-screen">
    <VolunteersHeaderSection />

    <div class="flex items-center gap-2 ml-auto">
      <UButton
        label="Gruppen verwalten"
        icon="i-lucide-users"
        color="neutral"
        variant="soft"
        @click="openGroupManagementModal"
      />
      <VolunteersSearchSection
        v-model="searchQuery"
        @open-filter="openAvailabilityFilterModal"
      />
      <UButton
        label="Neue Person"
        icon="i-lucide-plus"
        @click="openCreateVolunteerModal"
      />
    </div>

    <VolunteersTableSection
      :rows="tableRows"
      :selected-volunteer-ids="selectedVolunteerIds"
      @toggle-selection="toggleVolunteerSelection"
      @edit-volunteer="openEditVolunteerModal"
      @delete-volunteer="removeVolunteerWithConfirm"
    />

    <VolunteersEmailSelectionSection
      :group-options="groupOptions"
      :selected-emails="selectedEmails"
      :copied="copied"
      :is-supported="isSupported"
      @select-all-filtered="selectAllFiltered"
      @clear-selection="clearSelection"
      @select-by-groups="onSelectByGroups"
      @copy-selected="copySelectedEmails"
    />

    <VolunteersCsvTransferSection
      :import-summary="importSummary"
      @import-file="onImportFile"
      @export-csv="exportCsv"
    />

    <VolunteersFormModal
      v-model:open="isVolunteerModalOpen"
      :group-options="groupOptions"
      :volunteer="editingVolunteer"
      :external-error="volunteerError"
      @save-volunteer="onSaveVolunteer"
    />

    <VolunteersAvailabilityFilterModal
      v-model:open="isAvailabilityFilterModalOpen"
      v-model:filter="availabilityFilter"
    />

    <VolunteersGroupManagementModal
      v-model:open="isGroupManagementModalOpen"
      :groups="groups"
      :error-message="groupError"
      @create-group="onCreateGroup"
      @rename-group="onRenameGroup"
      @delete-group="removeGroupWithConfirm"
    />
  </div>
</template>
