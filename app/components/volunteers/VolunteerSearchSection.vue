<script setup lang="ts">
const query = defineModel<string>({ required: true })
</script>

<template>
  <section>
    <UInput
      v-model="query"
      placeholder="Suchen (Name, E-Mail, Notizen)"
      icon="i-lucide-search"
    />
  </section>
</template>
