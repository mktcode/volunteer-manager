<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useClipboard } from '@vueuse/core'
import { z } from 'zod'

definePageMeta({
  ssr: false
})

useHead({
  title: 'Freiwilligenverwaltung'
})

type GroupOption = {
  label: string
  value: string
}

type VolunteerRow = {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string
  notes: string
  groups: string[]
  groupsText: string
}

const toast = useToast()
const {
  volunteers,
  groups,
  searchQuery,
  filteredVolunteers,
  selectedVolunteerIds,
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
} = useVolunteers()

const volunteerSchema = z.object({
  firstname: z.string().trim().min(1),
  lastname: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  groups: z.array(z.string()).default([])
})

const groupSchema = z.object({
  name: z.string().trim().min(1)
})

const columns: TableColumn<VolunteerRow>[] = [
  { id: 'select', header: '' },
  { accessorKey: 'firstname', header: 'Vorname' },
  { accessorKey: 'lastname', header: 'Nachname' },
  { accessorKey: 'email', header: 'E-Mail' },
  { accessorKey: 'phone', header: 'Telefon' },
  { id: 'groups', header: 'Gruppen' },
  { id: 'actions', header: 'Aktionen' }
]

const tableRows = computed(() => {
  return filteredVolunteers.value.map(volunteer => ({
    ...volunteer,
    groupsText: getGroupNameList(volunteer.groups).join(', ')
  }))
})

const groupOptions = computed<GroupOption[]>(() => {
  return groups.value.map(group => ({
    label: group.name,
    value: group.id
  }))
})

const isVolunteerModalOpen = ref(false)
const editingVolunteerId = ref<string | null>(null)
const volunteerForm = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  notes: '',
  groups: [] as string[]
})
const volunteerError = ref('')

const newGroupName = ref('')
const groupError = ref('')
const editingGroupId = ref<string | null>(null)
const editingGroupName = ref('')

const selectedGroupIdsForBulk = ref<string[]>([])

const importSummary = ref<{ imported: number, skipped: number, errors: string[] } | null>(null)

const { copy, copied, isSupported } = useClipboard({ legacy: true })

function resetVolunteerForm() {
  volunteerForm.firstname = ''
  volunteerForm.lastname = ''
  volunteerForm.email = ''
  volunteerForm.phone = ''
  volunteerForm.notes = ''
  volunteerForm.groups = []
  volunteerError.value = ''
}

function openCreateVolunteerModal() {
  editingVolunteerId.value = null
  resetVolunteerForm()
  isVolunteerModalOpen.value = true
}

function openEditVolunteerModal(id: string) {
  const volunteer = volunteers.value.find(item => item.id === id)
  if (!volunteer) {
    return
  }

  editingVolunteerId.value = id
  volunteerForm.firstname = volunteer.firstname
  volunteerForm.lastname = volunteer.lastname
  volunteerForm.email = volunteer.email
  volunteerForm.phone = volunteer.phone
  volunteerForm.notes = volunteer.notes
  volunteerForm.groups = [...volunteer.groups]
  volunteerError.value = ''
  isVolunteerModalOpen.value = true
}

function saveVolunteer() {
  const parsed = volunteerSchema.safeParse(volunteerForm)
  if (!parsed.success) {
    volunteerError.value = 'Bitte prüfe die Eingaben im Formular.'
    return
  }

  const payload = {
    firstname: parsed.data.firstname,
    lastname: parsed.data.lastname,
    email: parsed.data.email,
    phone: parsed.data.phone || '',
    notes: parsed.data.notes || '',
    groups: parsed.data.groups
  }

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

  isVolunteerModalOpen.value = false
  resetVolunteerForm()
}

function removeVolunteer(id: string) {
  if (!window.confirm('Soll dieser Eintrag wirklich gelöscht werden?')) {
    return
  }

  deleteVolunteer(id)
}

function addGroup() {
  const parsed = groupSchema.safeParse({ name: newGroupName.value })
  if (!parsed.success) {
    groupError.value = 'Gruppenname ist erforderlich.'
    return
  }

  const result = createGroup(parsed.data.name)
  if (!result.ok) {
    groupError.value = result.error
    return
  }

  newGroupName.value = ''
  groupError.value = ''
}

function beginRenameGroup(id: string, name: string) {
  editingGroupId.value = id
  editingGroupName.value = name
  groupError.value = ''
}

function saveGroupRename() {
  if (!editingGroupId.value) {
    return
  }

  const parsed = groupSchema.safeParse({ name: editingGroupName.value })
  if (!parsed.success) {
    groupError.value = 'Gruppenname ist erforderlich.'
    return
  }

  const result = renameGroup(editingGroupId.value, parsed.data.name)
  if (!result.ok) {
    groupError.value = result.error
    return
  }

  editingGroupId.value = null
  editingGroupName.value = ''
  groupError.value = ''
}

function removeGroup(id: string) {
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

function selectByGroups() {
  if (!selectedGroupIdsForBulk.value.length) {
    return
  }

  selectVolunteersByGroupIds(selectedGroupIdsForBulk.value)
}

async function onCsvFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const content = await file.text()
  importSummary.value = importVolunteersFromCsv(content)

  if (importSummary.value.imported > 0) {
    toast.add({
      title: 'Import abgeschlossen',
      description: `${importSummary.value.imported} Einträge importiert.`,
      color: 'success'
    })
  }

  input.value = ''
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
  <div class="mx-auto max-w-7xl space-y-8 px-4 py-6">
    <section class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Freiwilligenverwaltung
        </h1>
        <p class="text-sm text-muted">
          Verwaltung von Helferinnen und Helfern für den Zoo.
        </p>
      </div>

      <UButton
        label="Neue Person"
        icon="i-lucide-plus"
        @click="openCreateVolunteerModal"
      />
    </section>

    <section>
      <UInput
        v-model="searchQuery"
        placeholder="Suchen (Name, E-Mail, Notizen)"
        icon="i-lucide-search"
      />
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium text-highlighted">
        Gruppen
      </h2>

      <div class="flex flex-wrap gap-2">
        <UInput
          v-model="newGroupName"
          placeholder="Neue Gruppe"
          class="min-w-64"
        />
        <UButton
          label="Gruppe anlegen"
          color="neutral"
          @click="addGroup"
        />
      </div>

      <p
        v-if="groupError"
        class="text-sm text-error"
      >
        {{ groupError }}
      </p>

      <div class="space-y-2">
        <div
          v-for="group in groups"
          :key="group.id"
          class="flex flex-wrap items-center gap-2"
        >
          <template v-if="editingGroupId === group.id">
            <UInput
              v-model="editingGroupName"
              class="min-w-56"
            />
            <UButton
              label="Speichern"
              size="sm"
              @click="saveGroupRename"
            />
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="soft"
              size="sm"
              @click="editingGroupId = null"
            />
          </template>

          <template v-else>
            <span class="text-sm">{{ group.name }}</span>
            <UButton
              label="Umbenennen"
              color="neutral"
              variant="soft"
              size="sm"
              @click="beginRenameGroup(group.id, group.name)"
            />
            <UButton
              label="Löschen"
              color="error"
              variant="soft"
              size="sm"
              @click="removeGroup(group.id)"
            />
          </template>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium text-highlighted">
        Freiwillige
      </h2>

      <UTable
        :data="tableRows"
        :columns="columns"
        empty="Keine Einträge vorhanden"
      >
        <template #select-cell="{ row }">
          <input
            type="checkbox"
            :checked="selectedVolunteerIds.includes(row.original.id)"
            @change="toggleVolunteerSelection(row.original.id)"
          >
        </template>

        <template #groups-cell="{ row }">
          <span>{{ row.original.groupsText || '—' }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex flex-wrap justify-end gap-1">
            <UButton
              label="Bearbeiten"
              color="neutral"
              variant="soft"
              size="sm"
              @click="openEditVolunteerModal(row.original.id)"
            />
            <UButton
              label="Löschen"
              color="error"
              variant="soft"
              size="sm"
              @click="removeVolunteer(row.original.id)"
            />
          </div>
        </template>
      </UTable>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium text-highlighted">
        E-Mail-Auswahl
      </h2>

      <div class="flex flex-wrap gap-2">
        <UButton
          label="Alle sichtbaren auswählen"
          color="neutral"
          variant="soft"
          @click="selectAllFiltered"
        />
        <UButton
          label="Auswahl löschen"
          color="neutral"
          variant="soft"
          @click="clearSelection"
        />
      </div>

      <div class="space-y-2">
        <p class="text-sm text-muted">
          Auswahl nach Gruppe:
        </p>
        <div class="flex flex-wrap gap-4">
          <label
            v-for="option in groupOptions"
            :key="option.value"
            class="inline-flex items-center gap-2 text-sm"
          >
            <input
              v-model="selectedGroupIdsForBulk"
              type="checkbox"
              :value="option.value"
            >
            {{ option.label }}
          </label>
        </div>
        <UButton
          label="Freiwillige aus gewählten Gruppen auswählen"
          color="neutral"
          variant="soft"
          @click="selectByGroups"
        />
      </div>

      <UTextarea
        :model-value="selectedEmails"
        readonly
        :rows="4"
      />

      <div class="flex items-center gap-3">
        <UButton
          label="E-Mails kopieren"
          :disabled="!selectedEmails || !isSupported"
          @click="copySelectedEmails"
        />
        <span
          v-if="copied"
          class="text-sm text-success"
        >
          Kopiert
        </span>
        <span
          v-else-if="!isSupported"
          class="text-sm text-error"
        >
          Zwischenablage wird vom Browser nicht unterstützt.
        </span>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium text-highlighted">
        CSV Import / Export
      </h2>

      <div class="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv"
          @change="onCsvFileChange"
        >

        <UButton
          label="CSV exportieren"
          color="neutral"
          variant="soft"
          @click="exportCsv"
        />
      </div>

      <div
        v-if="importSummary"
        class="space-y-2 text-sm"
      >
        <p>
          Importiert: {{ importSummary.imported }} · Übersprungen: {{ importSummary.skipped }}
        </p>
        <ul
          v-if="importSummary.errors.length"
          class="list-disc space-y-1 pl-5 text-error"
        >
          <li
            v-for="message in importSummary.errors"
            :key="message"
          >
            {{ message }}
          </li>
        </ul>
      </div>
    </section>

    <UModal v-model:open="isVolunteerModalOpen">
      <template #content>
        <div class="space-y-4 p-4">
          <h3 class="text-lg font-medium text-highlighted">
            {{ editingVolunteerId ? 'Person bearbeiten' : 'Neue Person' }}
          </h3>

          <UForm
            :schema="volunteerSchema"
            :state="volunteerForm"
            class="space-y-3"
            @submit.prevent="saveVolunteer"
          >
            <UInput
              v-model="volunteerForm.firstname"
              placeholder="Vorname"
            />
            <UInput
              v-model="volunteerForm.lastname"
              placeholder="Nachname"
            />
            <UInput
              v-model="volunteerForm.email"
              placeholder="E-Mail"
            />
            <UInput
              v-model="volunteerForm.phone"
              placeholder="Telefon"
            />

            <div class="space-y-2">
              <p class="text-sm text-muted">
                Gruppen
              </p>
              <div class="flex flex-wrap gap-4">
                <label
                  v-for="option in groupOptions"
                  :key="option.value"
                  class="inline-flex items-center gap-2 text-sm"
                >
                  <input
                    v-model="volunteerForm.groups"
                    type="checkbox"
                    :value="option.value"
                  >
                  {{ option.label }}
                </label>
              </div>
            </div>

            <UTextarea
              v-model="volunteerForm.notes"
              placeholder="Notizen"
              :rows="3"
            />

            <p
              v-if="volunteerError"
              class="text-sm text-error"
            >
              {{ volunteerError }}
            </p>

            <div class="flex justify-end gap-2">
              <UButton
                label="Abbrechen"
                color="neutral"
                variant="soft"
                @click="isVolunteerModalOpen = false"
              />
              <UButton
                type="submit"
                :label="editingVolunteerId ? 'Speichern' : 'Anlegen'"
              />
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </div>
</template>
