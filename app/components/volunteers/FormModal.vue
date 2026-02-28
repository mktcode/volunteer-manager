<script setup lang="ts">
import type { Availability, GroupOption, Volunteer, VolunteerInput } from '~/utils/volunteer-types'
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

function createEmptyAvailability(): Availability {
  return {
    oneTime: {
      moFrMorning: false,
      moFrAfternoon: false,
      saturdayMorning: false,
      saturdayAfternoon: false
    },
    recurringWeekly: {
      moFrMorning: false,
      moFrAfternoon: false,
      saturdayMorning: false,
      saturdayAfternoon: false
    },
    recurringMonthly: {
      moFrMorning: false,
      moFrAfternoon: false,
      saturdayMorning: false,
      saturdayAfternoon: false
    },
    projectBased: {
      moFrMorning: false,
      moFrAfternoon: false,
      saturdayMorning: false,
      saturdayAfternoon: false
    }
  }
}

function cloneAvailability(value?: Availability): Availability {
  const source = value || createEmptyAvailability()

  return {
    oneTime: {
      moFrMorning: Boolean(source.oneTime?.moFrMorning),
      moFrAfternoon: Boolean(source.oneTime?.moFrAfternoon),
      saturdayMorning: Boolean(source.oneTime?.saturdayMorning),
      saturdayAfternoon: Boolean(source.oneTime?.saturdayAfternoon)
    },
    recurringWeekly: {
      moFrMorning: Boolean(source.recurringWeekly?.moFrMorning),
      moFrAfternoon: Boolean(source.recurringWeekly?.moFrAfternoon),
      saturdayMorning: Boolean(source.recurringWeekly?.saturdayMorning),
      saturdayAfternoon: Boolean(source.recurringWeekly?.saturdayAfternoon)
    },
    recurringMonthly: {
      moFrMorning: Boolean(source.recurringMonthly?.moFrMorning),
      moFrAfternoon: Boolean(source.recurringMonthly?.moFrAfternoon),
      saturdayMorning: Boolean(source.recurringMonthly?.saturdayMorning),
      saturdayAfternoon: Boolean(source.recurringMonthly?.saturdayAfternoon)
    },
    projectBased: {
      moFrMorning: Boolean(source.projectBased?.moFrMorning),
      moFrAfternoon: Boolean(source.projectBased?.moFrAfternoon),
      saturdayMorning: Boolean(source.projectBased?.saturdayMorning),
      saturdayAfternoon: Boolean(source.projectBased?.saturdayAfternoon)
    }
  }
}

const availabilitySections = [
  { key: 'oneTime', label: 'einmalige Einsätze' },
  { key: 'recurringWeekly', label: 'wiederkehrende Einsätze wöchentlich' },
  { key: 'recurringMonthly', label: 'wiederkehrende Einsätze monatlich' },
  { key: 'projectBased', label: 'projektbezogene Einsätze' }
] as const

const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  street: '',
  postalCode: '',
  city: '',
  interests: '',
  availability: createEmptyAvailability(),
  notes: '',
  groups: [] as string[]
})

const internalError = ref('')
const formId = 'volunteer-form'
const fieldErrors = reactive({
  firstname: '',
  lastname: '',
  email: ''
})

function clearFieldErrors() {
  fieldErrors.firstname = ''
  fieldErrors.lastname = ''
  fieldErrors.email = ''
}

function setFieldErrors(errors: Array<{ name?: string, message: string }>) {
  clearFieldErrors()

  for (const error of errors) {
    if (!error.name || !(error.name in fieldErrors)) {
      continue
    }

    if (!fieldErrors[error.name as keyof typeof fieldErrors]) {
      fieldErrors[error.name as keyof typeof fieldErrors] = error.message
    }
  }
}

function setFieldErrorsFromSchema() {
  const parsed = volunteerFormSchema.safeParse(form)
  if (parsed.success) {
    clearFieldErrors()
    return
  }

  setFieldErrors(parsed.error.issues.map(issue => ({
    name: typeof issue.path[0] === 'string' ? issue.path[0] : undefined,
    message: issue.message
  })))
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    return
  }

  if (props.volunteer) {
    form.firstname = props.volunteer.firstname
    form.lastname = props.volunteer.lastname
    form.email = props.volunteer.email
    form.phone = props.volunteer.phone
    form.street = props.volunteer.street
    form.postalCode = props.volunteer.postalCode
    form.city = props.volunteer.city
    form.interests = props.volunteer.interests
    form.availability = cloneAvailability(props.volunteer.availability)
    form.notes = props.volunteer.notes
    form.groups = [...props.volunteer.groups]
  } else {
    form.firstname = ''
    form.lastname = ''
    form.email = ''
    form.phone = ''
    form.street = ''
    form.postalCode = ''
    form.city = ''
    form.interests = ''
    form.availability = createEmptyAvailability()
    form.notes = ''
    form.groups = []
  }

  internalError.value = ''
  clearFieldErrors()
})

function onSubmit() {
  const parsed = volunteerFormSchema.safeParse(form)
  if (!parsed.success) {
    internalError.value = 'Bitte prüfe die Eingaben im Formular.'
    setFieldErrorsFromSchema()
    return
  }

  internalError.value = ''
  clearFieldErrors()
  emit('saveVolunteer', {
    firstname: parsed.data.firstname,
    lastname: parsed.data.lastname,
    email: parsed.data.email,
    phone: parsed.data.phone || '',
    street: parsed.data.street || '',
    postalCode: parsed.data.postalCode || '',
    city: parsed.data.city || '',
    interests: parsed.data.interests || '',
    availability: parsed.data.availability,
    notes: parsed.data.notes || '',
    groups: parsed.data.groups
  })
}

function onFormError(event?: { errors?: Array<{ name?: string, message: string }> }) {
  internalError.value = 'Bitte prüfe die Eingaben im Formular.'

  if (event?.errors?.length) {
    setFieldErrors(event.errors)
    return
  }

  setFieldErrorsFromSchema()
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <h3 class="text-lg font-medium text-highlighted">
        {{ volunteer ? 'Person bearbeiten' : 'Neue Person' }}
      </h3>
    </template>

    <template #body>
      <UForm
        :id="formId"
        :schema="volunteerFormSchema"
        :state="form"
        class="flex flex-col gap-3"
        @submit.prevent="onSubmit"
        @error="onFormError"
      >
        <UInput
          v-model="form.firstname"
          placeholder="Vorname"
        />
        <p
          v-if="fieldErrors.firstname"
          class="text-sm text-error"
        >
          {{ fieldErrors.firstname }}
        </p>
        <UInput
          v-model="form.lastname"
          placeholder="Nachname"
        />
        <p
          v-if="fieldErrors.lastname"
          class="text-sm text-error"
        >
          {{ fieldErrors.lastname }}
        </p>
        <UInput
          v-model="form.email"
          placeholder="E-Mail"
        />
        <p
          v-if="fieldErrors.email"
          class="text-sm text-error"
        >
          {{ fieldErrors.email }}
        </p>
        <UInput
          v-model="form.phone"
          placeholder="Telefon"
        />
        <UInput
          v-model="form.street"
          placeholder="Straße"
        />
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <UInput
            v-model="form.postalCode"
            placeholder="Postleitzahl"
          />
          <UInput
            v-model="form.city"
            placeholder="Ort"
          />
        </div>

        <UTextarea
          v-model="form.interests"
          placeholder="Interesse an"
          :rows="2"
        />

        <div class="flex flex-col gap-3">
          <p class="text-muted">
            Mögliche Zeiträume für Mitarbeit
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
                        v-model="form.availability[section.key].moFrMorning"
                        type="checkbox"
                      >
                    </td>
                    <td class="border px-2 py-1 text-center">
                      <input
                        v-model="form.availability[section.key].moFrAfternoon"
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
                        v-model="form.availability[section.key].saturdayMorning"
                        type="checkbox"
                      >
                    </td>
                    <td class="border px-2 py-1 text-center">
                      <input
                        v-model="form.availability[section.key].saturdayAfternoon"
                        type="checkbox"
                      >
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-muted">
            {{ groupOptions.length > 0 ? 'Gruppen' : 'Noch keine Gruppen vorhanden.' }}
          </p>
          <div class="flex flex-wrap gap-4">
            <label
              v-for="option in groupOptions"
              :key="option.value"
              class="inline-flex items-center gap-2"
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
          class="text-error"
        >
          {{ internalError || externalError }}
        </p>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="soft"
          @click="emit('update:open', false)"
        />
        <UButton
          type="submit"
          :form="formId"
          :label="volunteer ? 'Speichern' : 'Anlegen'"
        />
      </div>
    </template>
  </UModal>
</template>
