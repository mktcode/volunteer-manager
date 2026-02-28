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

function getAvailabilitySectionCount(row: VolunteerRow) {
  return availabilitySections.reduce((count, section) => {
    const period = row.availability[section.key]

    if (period.moFrMorning || period.moFrAfternoon || period.saturdayMorning || period.saturdayAfternoon) {
      return count + 1
    }

    return count
  }, 0)
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
  { id: 'availability', header: 'Verfügbarkeit' },
  { id: 'groups', header: 'Gruppen' },
  {
    id: 'actions',
    header: 'Aktionen',
    size: 220,
    meta: {
      class: {
        th: 'text-right min-w-[220px]',
        td: 'text-right min-w-[220px]'
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
          square
          class="min-h-7 min-w-7"
          aria-label="Verfügbarkeiten ein-/ausklappen"
          :icon="row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
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
        <span>{{ [row.original.street, row.original.postalCode, row.original.city].filter(Boolean).join(', ') || '—' }}</span>
      </template>

      <template #availability-cell="{ row }">
        <UBadge
          :label="`${getAvailabilitySectionCount(row.original)}/4 Bereiche`"
          color="neutral"
          variant="subtle"
        />
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
