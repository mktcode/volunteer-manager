<script setup lang="ts">
import type { GroupOption, Volunteer, VolunteerInput } from '~/utils/volunteer-types'
import { volunteerFormSchema } from '~/utils/volunteer-schemas'

const props = defineProps<{
  open: boolean
  groupOptions: GroupOption[]
  volunteer: Volunteer | null
  externalError: string
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saveVolunteer': [payload: VolunteerInput]
}>()

const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  notes: '',
  groups: [] as string[]
})

const internalError = ref('')

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    return
  }

  if (props.volunteer) {
    form.firstname = props.volunteer.firstname
    form.lastname = props.volunteer.lastname
    form.email = props.volunteer.email
    form.phone = props.volunteer.phone
    form.notes = props.volunteer.notes
    form.groups = [...props.volunteer.groups]
  } else {
    form.firstname = ''
    form.lastname = ''
    form.email = ''
    form.phone = ''
    form.notes = ''
    form.groups = []
  }

  internalError.value = ''
})

function onSubmit() {
  const parsed = volunteerFormSchema.safeParse(form)
  if (!parsed.success) {
    internalError.value = 'Bitte prüfe die Eingaben im Formular.'
    return
  }

  internalError.value = ''
  emit('saveVolunteer', {
    firstname: parsed.data.firstname,
    lastname: parsed.data.lastname,
    email: parsed.data.email,
    phone: parsed.data.phone || '',
    notes: parsed.data.notes || '',
    groups: parsed.data.groups
  })
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="flex flex-col gap-4 p-4">
        <h3 class="text-lg font-medium text-highlighted">
          {{ volunteer ? 'Person bearbeiten' : 'Neue Person' }}
        </h3>

        <UForm
          :schema="volunteerFormSchema"
          :state="form"
          class="flex flex-col gap-3"
          @submit.prevent="onSubmit"
        >
          <UInput
            v-model="form.firstname"
            placeholder="Vorname"
          />
          <UInput
            v-model="form.lastname"
            placeholder="Nachname"
          />
          <UInput
            v-model="form.email"
            placeholder="E-Mail"
          />
          <UInput
            v-model="form.phone"
            placeholder="Telefon"
          />

          <div class="flex flex-col gap-2">
            <p class="text-sm text-muted">
              Gruppen
            </p>
            <div class="flex flex-wrap gap-4">
              <label
                v-for="option in groupOptions"
                :key="option.value"
                class="inline-flex items-center gap-2 text-sm"
              >
                <input
                  v-model="form.groups"
                  type="checkbox"
                  :value="option.value"
                >
                {{ option.label }}
              </label>
            </div>
          </div>

          <UTextarea
            v-model="form.notes"
            placeholder="Notizen"
            :rows="3"
          />

          <p
            v-if="internalError || externalError"
            class="text-sm text-error"
          >
            {{ internalError || externalError }}
          </p>

          <div class="flex justify-end gap-2">
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="soft"
              @click="emit('update:open', false)"
            />
            <UButton
              type="submit"
              :label="volunteer ? 'Speichern' : 'Anlegen'"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
