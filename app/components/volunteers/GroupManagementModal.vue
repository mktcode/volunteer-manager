<script setup lang="ts">
import type { Group } from '~/utils/volunteer-types'

const open = defineModel<boolean>('open', { required: true })

defineProps<{
  groups: Group[]
  errorMessage: string
}>()

const emit = defineEmits<{
  createGroup: [name: string]
  renameGroup: [payload: { id: string, name: string }]
  deleteGroup: [id: string]
}>()
</script>

<template>
  <UModal
    :open="open"
    @update:open="open = $event"
  >
    <template #header>
      <h3 class="text-lg font-medium text-highlighted">
        Gruppen verwalten
      </h3>
    </template>

    <template #body>
      <div>
        <VolunteersGroupManagementSection
          :groups="groups"
          :show-title="false"
          :error-message="errorMessage"
          @create-group="emit('createGroup', $event)"
          @rename-group="emit('renameGroup', $event)"
          @delete-group="emit('deleteGroup', $event)"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          label="Schließen"
          color="neutral"
          variant="soft"
          @click="open = false"
        />
      </div>
    </template>
  </UModal>
</template>
