<script setup lang="ts">
import type { Group } from '~/utils/volunteer-types'

const props = defineProps<{
  groups: Group[]
  errorMessage: string
}>()

const emit = defineEmits<{
  createGroup: [name: string]
  renameGroup: [payload: { id: string, name: string }]
  deleteGroup: [id: string]
}>()

const newGroupName = ref('')
const editingGroupId = ref<string | null>(null)
const editingGroupName = ref('')

function onCreateGroup() {
  emit('createGroup', newGroupName.value)
  if (!props.errorMessage) {
    newGroupName.value = ''
  }
}

function beginRenameGroup(id: string, name: string) {
  editingGroupId.value = id
  editingGroupName.value = name
}

function onSaveRename() {
  if (!editingGroupId.value) {
    return
  }

  emit('renameGroup', {
    id: editingGroupId.value,
    name: editingGroupName.value
  })

  if (!props.errorMessage) {
    editingGroupId.value = null
    editingGroupName.value = ''
  }
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-lg font-medium text-highlighted">
      Gruppen
    </h2>

    <div class="flex items-center gap-2">
      <UInput
        v-model="newGroupName"
        placeholder="Neue Gruppe"
        class="w-full max-w-64 flex-1"
      />
      <UButton
        label="Gruppe anlegen"
        icon="i-lucide-plus"
        @click="onCreateGroup"
      />
    </div>

    <p
      v-if="errorMessage"
      class="text-error"
    >
      {{ errorMessage }}
    </p>

    <div class="flex flex-col gap-2">
      <div
        v-for="group in groups"
        :key="group.id"
        class="flex flex-wrap items-center gap-2 border border-gray-100 rounded-md px-3 py-2"
      >
        <template v-if="editingGroupId === group.id">
          <UInput
            v-model="editingGroupName"
            class="min-w-56 mr-auto"
          />
          <UButton
            label="Speichern"
            @click="onSaveRename"
          />
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="soft"
            @click="editingGroupId = null"
          />
        </template>

        <template v-else>
          <span class="mr-auto">{{ group.name }}</span>
          <UButton
            label="Umbenennen"
            color="neutral"
            variant="soft"
            @click="beginRenameGroup(group.id, group.name)"
          />
          <UButton
            label="Löschen"
            color="error"
            variant="soft"
            @click="emit('deleteGroup', group.id)"
          />
        </template>
      </div>
      <div v-if="groups.length === 0" class="text-gray-500">
        Noch keine Gruppen vorhanden.
      </div>
    </div>
  </section>
</template>
