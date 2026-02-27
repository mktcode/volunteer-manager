<script setup lang="ts">
const emit = defineEmits<{
  createVolunteer: []
}>()
</script>

<template>
  <section class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Freiwilligenverwaltung
      </h1>
      <p class="text-sm text-muted">
        Verwaltung von Helferinnen und Helfern für den Zoo.
      </p>
    </div>

    <UButton
      label="Neue Person"
      icon="i-lucide-plus"
      @click="emit('createVolunteer')"
    />
  </section>
</template>
