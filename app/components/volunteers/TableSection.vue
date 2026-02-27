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

      <template #actions-cell="{ row }">
        <div class="flex flex-wrap justify-end gap-1">
          <UButton
            label="Bearbeiten"
            color="neutral"
            variant="soft"
            size="sm"
            @click="emit('editVolunteer', row.original.id)"
          />
          <UButton
            label="Löschen"
            color="error"
            variant="soft"
            size="sm"
            @click="emit('deleteVolunteer', row.original.id)"
          />
        </div>
      </template>
    </UTable>
  </section>
</template>
