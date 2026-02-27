export interface Volunteer {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string
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
}

export interface CsvRow {
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  groups?: string
  notes?: string
}
