export interface AvailabilityPeriod {
  moFrMorning: boolean
  moFrAfternoon: boolean
  saturdayMorning: boolean
  saturdayAfternoon: boolean
}

export interface Availability {
  oneTime: AvailabilityPeriod
  recurringWeekly: AvailabilityPeriod
  recurringMonthly: AvailabilityPeriod
  projectBased: AvailabilityPeriod
}

export interface Volunteer {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string
  street: string
  postalCode: string
  city: string
  interests: string
  availability: Availability
  groups: string[]
  notes: string
}

export interface Group {
  id: string
  name: string
}

export interface StorageSchema {
  volunteers: Volunteer[]
  groups: Group[]
}

export interface VolunteerInput {
  firstname: string
  lastname: string
  email: string
  phone?: string
  street?: string
  postalCode?: string
  city?: string
  interests?: string
  availability?: Availability
  groups?: string[]
  notes?: string
}

export interface ImportSummary {
  imported: number
  skipped: number
  errors: string[]
}

export interface GroupOption {
  label: string
  value: string
}

export interface VolunteerRow extends Volunteer {
  groupsText: string
  availabilityText: string
}

export interface CsvRow {
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  street?: string
  postalCode?: string
  city?: string
  interests?: string
  availabilityOneTimeMoFrMorning?: string
  availabilityOneTimeMoFrAfternoon?: string
  availabilityOneTimeSaturdayMorning?: string
  availabilityOneTimeSaturdayAfternoon?: string
  availabilityRecurringWeeklyMoFrMorning?: string
  availabilityRecurringWeeklyMoFrAfternoon?: string
  availabilityRecurringWeeklySaturdayMorning?: string
  availabilityRecurringWeeklySaturdayAfternoon?: string
  availabilityRecurringMonthlyMoFrMorning?: string
  availabilityRecurringMonthlyMoFrAfternoon?: string
  availabilityRecurringMonthlySaturdayMorning?: string
  availabilityRecurringMonthlySaturdayAfternoon?: string
  availabilityProjectBasedMoFrMorning?: string
  availabilityProjectBasedMoFrAfternoon?: string
  availabilityProjectBasedSaturdayMorning?: string
  availabilityProjectBasedSaturdayAfternoon?: string
  groups?: string
  notes?: string
}
