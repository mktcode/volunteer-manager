<script setup lang="ts">
import type { ImportSummary } from '~/utils/volunteer-types'

defineProps<{
  importSummary: ImportSummary | null
}>()

const emit = defineEmits<{
  importFile: [file: File]
  exportCsv: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  emit('importFile', file)
  input.value = ''
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-lg font-medium text-highlighted">
      Import / Export
    </h2>

    <div class="flex flex-wrap items-center gap-3">
      <input
        class="hidden"
        type="file"
        accept=".csv,text/csv"
        @change="onFileChange"
        ref="fileInput"
      >
      <UButton
        label="Daten importieren"
        color="neutral"
        variant="soft"
        @click="fileInput?.click()"
      />

      <UButton
        label="Daten exportieren"
        color="neutral"
        variant="soft"
        @click="emit('exportCsv')"
      />
    </div>

    <div
      v-if="importSummary"
      class="flex flex-col gap-2"
    >
      <p>
        Importiert: {{ importSummary.imported }} · Übersprungen: {{ importSummary.skipped }}
      </p>
      <ul
        v-if="importSummary.errors.length"
        class="list-disc flex flex-col gap-1 pl-5 text-error"
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
</template>
