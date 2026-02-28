import { z } from 'zod'

export const emailSchema = z.string().trim().email()

const emptyAvailabilityPeriod = {
  moFrMorning: false,
  moFrAfternoon: false,
  saturdayMorning: false,
  saturdayAfternoon: false
}

const emptyAvailability = {
  oneTime: emptyAvailabilityPeriod,
  recurringWeekly: emptyAvailabilityPeriod,
  recurringMonthly: emptyAvailabilityPeriod,
  projectBased: emptyAvailabilityPeriod
}

export const availabilityPeriodSchema = z.object({
  moFrMorning: z.boolean(),
  moFrAfternoon: z.boolean(),
  saturdayMorning: z.boolean(),
  saturdayAfternoon: z.boolean()
})

export const availabilitySchema = z.object({
  oneTime: availabilityPeriodSchema,
  recurringWeekly: availabilityPeriodSchema,
  recurringMonthly: availabilityPeriodSchema,
  projectBased: availabilityPeriodSchema
})

export const volunteerSchema = z.object({
  id: z.string().min(1),
  firstname: z.string().trim().min(1, { message: 'Bitte den Vornamen eingeben.' }),
  lastname: z.string().trim().min(1, { message: 'Bitte den Nachnamen eingeben.' }),
  email: z.string().trim()
    .min(1, { message: 'Bitte eine E-Mail-Adresse eingeben.' })
    .email({ message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }),
  phone: z.string().trim().default(''),
  street: z.string().trim().default(''),
  postalCode: z.string().trim().default(''),
  city: z.string().trim().default(''),
  interests: z.string().trim().default(''),
  availability: availabilitySchema.default(emptyAvailability),
  groups: z.array(z.string()).default([]),
  notes: z.string().trim().default('')
})

export const groupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1)
})

export const storageSchema = z.object({
  volunteers: z.array(volunteerSchema),
  groups: z.array(groupSchema)
})

export const csvRowSchema = z.object({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  interests: z.string().optional(),
  availabilityOneTimeMoFrMorning: z.string().optional(),
  availabilityOneTimeMoFrAfternoon: z.string().optional(),
  availabilityOneTimeSaturdayMorning: z.string().optional(),
  availabilityOneTimeSaturdayAfternoon: z.string().optional(),
  availabilityRecurringWeeklyMoFrMorning: z.string().optional(),
  availabilityRecurringWeeklyMoFrAfternoon: z.string().optional(),
  availabilityRecurringWeeklySaturdayMorning: z.string().optional(),
  availabilityRecurringWeeklySaturdayAfternoon: z.string().optional(),
  availabilityRecurringMonthlyMoFrMorning: z.string().optional(),
  availabilityRecurringMonthlyMoFrAfternoon: z.string().optional(),
  availabilityRecurringMonthlySaturdayMorning: z.string().optional(),
  availabilityRecurringMonthlySaturdayAfternoon: z.string().optional(),
  availabilityProjectBasedMoFrMorning: z.string().optional(),
  availabilityProjectBasedMoFrAfternoon: z.string().optional(),
  availabilityProjectBasedSaturdayMorning: z.string().optional(),
  availabilityProjectBasedSaturdayAfternoon: z.string().optional(),
  groups: z.string().optional(),
  notes: z.string().optional()
})

export const volunteerFormSchema = z.object({
  firstname: z.string().trim().min(1, { message: 'Bitte den Vornamen eingeben.' }),
  lastname: z.string().trim().min(1, { message: 'Bitte den Nachnamen eingeben.' }),
  email: z.string().trim()
    .min(1, { message: 'Bitte eine E-Mail-Adresse eingeben.' })
    .email({ message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }),
  phone: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  interests: z.string().optional(),
  availability: availabilitySchema.default(emptyAvailability),
  notes: z.string().optional(),
  groups: z.array(z.string()).default([])
})

export const groupFormSchema = z.object({
  name: z.string().trim().min(1)
})
