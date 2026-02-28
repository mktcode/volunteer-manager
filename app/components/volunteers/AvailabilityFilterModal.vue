<script setup lang="ts">
import type { Availability } from '~/utils/volunteer-types'

const open = defineModel<boolean>('open', { required: true })
const filter = defineModel<Availability>('filter', { required: true })

const availabilitySections = [
  { key: 'oneTime', label: 'einmalige Einsätze' },
  { key: 'recurringWeekly', label: 'wiederkehrende Einsätze wöchentlich' },
  { key: 'recurringMonthly', label: 'wiederkehrende Einsätze monatlich' },
  { key: 'projectBased', label: 'projektbezogene Einsätze' }
] as const
</script>

<template>
  <UModal
    :open="open"
    @update:open="open = $event"
  >
    <template #content>
      <div class="flex flex-col gap-4 p-4">
        <h3 class="text-lg font-medium text-highlighted">
          Verfügbarkeit filtern
        </h3>

        <p class="text-sm text-muted">
          Zeige Personen, die in mindestens einem ausgewählten Zeitraum verfügbar sind.
        </p>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th class="border px-2 py-1 text-left font-medium">
                  Bereich
                </th>
                <th class="border px-2 py-1 text-left font-medium">
                  Tag
                </th>
                <th class="border px-2 py-1 text-center font-medium">
                  vormittags
                </th>
                <th class="border px-2 py-1 text-center font-medium">
                  nachmittags
                </th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="section in availabilitySections"
                :key="section.key"
              >
                <tr>
                  <td
                    class="border px-2 py-1 font-medium"
                    rowspan="2"
                  >
                    {{ section.label }}
                  </td>
                  <td class="border px-2 py-1">
                    Mo-Fr
                  </td>
                  <td class="border px-2 py-1 text-center">
                    <input
                      v-model="filter[section.key].moFrMorning"
                      type="checkbox"
                    >
                  </td>
                  <td class="border px-2 py-1 text-center">
                    <input
                      v-model="filter[section.key].moFrAfternoon"
                      type="checkbox"
                    >
                  </td>
                </tr>
                <tr>
                  <td class="border px-2 py-1">
                    Samstag
                  </td>
                  <td class="border px-2 py-1 text-center">
                    <input
                      v-model="filter[section.key].saturdayMorning"
                      type="checkbox"
                    >
                  </td>
                  <td class="border px-2 py-1 text-center">
                    <input
                      v-model="filter[section.key].saturdayAfternoon"
                      type="checkbox"
                    >
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end">
          <UButton
            label="Schließen"
            color="neutral"
            variant="soft"
            @click="open = false"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
