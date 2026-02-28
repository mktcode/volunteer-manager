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
    <template #content>
      <div class="flex flex-col gap-4 p-4">
        <VolunteersGroupManagementSection
          :groups="groups"
          :error-message="errorMessage"
          @create-group="emit('createGroup', $event)"
          @rename-group="emit('renameGroup', $event)"
          @delete-group="emit('deleteGroup', $event)"
        />

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
