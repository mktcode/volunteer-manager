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

const tableRows = computed<VolunteerRow[]>(() => {
  return filteredVolunteers.value.map(volunteer => ({
    ...volunteer,
    groupsText: getGroupNameList(volunteer.groups).join(', ')
  }))
})

const groupError = ref('')

const isVolunteerModalOpen = ref(false)
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
  if (!window.confirm('Soll diese Gruppe wirklich gelöscht werden?')) {
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
  const link = document.createElement('a')
  link.href = url
  link.download = 'freiwillige-helfer-osnabrueck.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6">
    <VolunteersHeaderSection />

    <VolunteersGroupManagementSection
      :groups="groups"
      :error-message="groupError"
      @create-group="onCreateGroup"
      @rename-group="onRenameGroup"
      @delete-group="removeGroupWithConfirm"
    />

    <div class="flex items-center gap-4">
      <h2 class="text-lg font-medium text-highlighted mr-auto">
        Freiwillige
      </h2>
      <VolunteersSearchSection v-model="searchQuery" />
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
  </div>
</template>
