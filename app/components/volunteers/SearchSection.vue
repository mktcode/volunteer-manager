<script setup lang="ts">
const query = defineModel<string>({ required: true })

const emit = defineEmits<{
  'open-filter': []
}>()
</script>

<template>
  <section>
    <div class="flex items-center gap-2">
      <UInput
        v-model="query"
        placeholder="Suchen (Name, E-Mail, Notizen)"
        icon="i-lucide-search"
      />
      <UButton
        label="Nach Verfügbarkeit filtern"
        icon="i-lucide-filter"
        color="neutral"
        variant="soft"
        @click="emit('open-filter')"
      />
    </div>
  </section>
</template>
