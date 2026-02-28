<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { VolunteerRow } from '~/utils/volunteer-types'

const props = defineProps<{
  rows: VolunteerRow[]
  selectedVolunteerIds: string[]
}>()

const emit = defineEmits<{
  toggleSelection: [id: string]
  editVolunteer: [id: string]
  deleteVolunteer: [id: string]
}>()

const columns: TableColumn<VolunteerRow>[] = [
  { id: 'select', header: '' },
  { accessorKey: 'firstname', header: 'Vorname' },
  { accessorKey: 'lastname', header: 'Nachname' },
  { accessorKey: 'email', header: 'E-Mail' },
  { accessorKey: 'phone', header: 'Telefon' },
  { id: 'address', header: 'Adresse' },
  { accessorKey: 'interests', header: 'Interesse an' },
  { id: 'availability', header: 'Verfügbarkeit' },
  { id: 'groups', header: 'Gruppen' },
  { id: 'actions', header: 'Aktionen' }
]
</script>

<template>
  <section class="flex flex-col gap-3">
    <UTable
      :data="rows"
      :columns="columns"
      empty="Keine Einträge vorhanden"
    >
      <template #select-cell="{ row }">
        <input
          type="checkbox"
          :checked="props.selectedVolunteerIds.includes(row.original.id)"
          @change="emit('toggleSelection', row.original.id)"
        >
      </template>

      <template #groups-cell="{ row }">
        <span>{{ row.original.groupsText || '—' }}</span>
      </template>

      <template #address-cell="{ row }">
        <span>{{ [row.original.street, row.original.postalCode, row.original.city].filter(Boolean).join(', ') || '—' }}</span>
      </template>

      <template #availability-cell="{ row }">
        <span>{{ row.original.availabilityText || '—' }}</span>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex flex-wrap justify-end gap-1">
          <UButton
            label="Bearbeiten"
            icon="i-lucide-edit"
            color="neutral"
            variant="soft"
            @click="emit('editVolunteer', row.original.id)"
          />
          <UButton
            label="Löschen"
            icon="i-lucide-trash-2"
            color="error"
            variant="soft"
            @click="emit('deleteVolunteer', row.original.id)"
          />
        </div>
      </template>
    </UTable>
  </section>
</template>
