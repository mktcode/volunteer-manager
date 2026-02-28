<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { VolunteerRow } from '~/utils/volunteer-types'

const expanded = ref<Record<string, boolean>>({})
const columnPinning = ref({
  right: ['actions']
})

const availabilitySections = [
  { key: 'oneTime', label: 'einmalige Einsätze' },
  { key: 'recurringWeekly', label: 'wiederkehrende Einsätze wöchentlich' },
  { key: 'recurringMonthly', label: 'wiederkehrende Einsätze monatlich' },
  { key: 'projectBased', label: 'projektbezogene Einsätze' }
] as const

function getAvailabilityLabels(morning: boolean, afternoon: boolean) {
  const labels: string[] = []

  if (morning) {
    labels.push('vormittags')
  }

  if (afternoon) {
    labels.push('nachmittags')
  }

  return labels
}

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
  {
    id: 'expand',
    header: '',
    size: 48,
    meta: {
      class: {
        th: 'w-12',
        td: 'w-12'
      }
    }
  },
  { id: 'select', header: '' },
  { accessorKey: 'firstname', header: 'Vorname' },
  { accessorKey: 'lastname', header: 'Nachname' },
  { accessorKey: 'email', header: 'E-Mail' },
  { accessorKey: 'phone', header: 'Telefon' },
  { id: 'address', header: 'Adresse' },
  { accessorKey: 'interests', header: 'Interesse an' },
  { id: 'groups', header: 'Gruppen' },
  {
    id: 'actions',
    header: 'Aktionen',
    size: 150,
    meta: {
      class: {
        th: 'text-right min-w-[220px] bg-white',
        td: 'text-right min-w-[220px] bg-white'
      }
    }
  }
]
</script>

<template>
  <section class="flex flex-col gap-3">
    <UTable
      v-model:expanded="expanded"
      v-model:column-pinning="columnPinning"
      :data="rows"
      :columns="columns"
      sticky
      empty="Keine Einträge vorhanden"
      :ui="{
        tr: 'data-[expanded=true]:bg-elevated/30'
      }"
    >
      <template #expand-cell="{ row }">
        <UButton
          color="neutral"
          variant="soft"
          size="lg"
          label="Verfügbarkeit"
          aria-label="Verfügbarkeiten ein-/ausklappen"
          :icon="row.getIsExpanded() ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          @click="row.toggleExpanded()"
        />
      </template>

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
        <div class="flex flex-col leading-tight">
          <span>{{ row.original.street || '—' }}</span>
          <span class="text-muted">{{ [row.original.postalCode, row.original.city].filter(Boolean).join(' ') || '—' }}</span>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex flex-wrap justify-end gap-1">
          <UButton
            icon="i-lucide-edit"
            color="neutral"
            variant="soft"
            @click="emit('editVolunteer', row.original.id)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="soft"
            @click="emit('deleteVolunteer', row.original.id)"
          />
        </div>
      </template>

      <template #expanded="{ row }">
        <div class="grid gap-3 p-3 md:grid-cols-2">
          <div
            v-for="section in availabilitySections"
            :key="section.key"
            class="rounded border border-default p-3"
          >
            <p class="mb-2 font-medium text-highlighted">
              {{ section.label }}
            </p>

            <div class="flex flex-col gap-2 text-sm text-muted">
              <div class="flex items-center gap-2">
                <span class="w-14">Mo-Fr</span>
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="label in getAvailabilityLabels(row.original.availability[section.key].moFrMorning, row.original.availability[section.key].moFrAfternoon)"
                    :key="`mofr-${section.key}-${label}`"
                    :label="label"
                    color="primary"
                    variant="soft"
                    size="sm"
                  />
                  <span v-if="!getAvailabilityLabels(row.original.availability[section.key].moFrMorning, row.original.availability[section.key].moFrAfternoon).length">—</span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span class="w-14">Samstag</span>
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="label in getAvailabilityLabels(row.original.availability[section.key].saturdayMorning, row.original.availability[section.key].saturdayAfternoon)"
                    :key="`sa-${section.key}-${label}`"
                    :label="label"
                    color="primary"
                    variant="soft"
                    size="sm"
                  />
                  <span v-if="!getAvailabilityLabels(row.original.availability[section.key].saturdayMorning, row.original.availability[section.key].saturdayAfternoon).length">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UTable>
  </section>
</template>
