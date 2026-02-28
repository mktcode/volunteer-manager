<script setup lang="ts">
import type { GroupOption } from '~/utils/volunteer-types'

defineProps<{
  groupOptions: GroupOption[]
  selectedEmails: string
  copied: boolean
  isSupported: boolean
}>()

const emit = defineEmits<{
  selectAllFiltered: []
  clearSelection: []
  selectByGroups: [groupIds: string[]]
  copySelected: []
}>()

const selectedGroupIdsForBulk = ref<string[]>([])

watch(selectedGroupIdsForBulk, (groupIds) => {
  emit('selectByGroups', [...groupIds])
})

function onClearSelection() {
  selectedGroupIdsForBulk.value = []
  emit('clearSelection')
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-lg font-medium text-highlighted">
      E-Mail-Auswahl
    </h2>

    <div class="flex flex-wrap gap-2">
      <UButton
        label="Alle sichtbaren auswählen"
        color="neutral"
        variant="soft"
        @click="emit('selectAllFiltered')"
      />
      <UButton
        label="Auswahl löschen"
        color="neutral"
        variant="soft"
        @click="onClearSelection"
      />
    </div>

    <div class="flex flex-col gap-2">
      <p class="text-muted">
        Auswahl nach Gruppe: <span v-if="groupOptions.length === 0">Noch keine Gruppen vorhanden.</span>
      </p>
      <div class="flex flex-wrap gap-4">
        <label
          v-for="option in groupOptions"
          :key="option.value"
          class="inline-flex items-center gap-2"
        >
          <input
            v-model="selectedGroupIdsForBulk"
            type="checkbox"
            :value="option.value"
          >
          {{ option.label }}
        </label>
      </div>
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
        @click="emit('copySelected')"
      />
      <span
        v-if="copied"
        class="text-success"
      >
        Kopiert
      </span>
      <span
        v-else-if="!isSupported"
        class="text-error"
      >
        Zwischenablage wird vom Browser nicht unterstützt.
      </span>
    </div>
  </section>
</template>
