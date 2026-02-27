# Volunteer Management App – Implementation Plan

## 1. Project Constraints

* Nuxt 4 application
* Client-side only (no server routes, no SSR logic for this feature)
* Data persistence via `localStorage` (https://vueuse.org/core/useLocalStorage/)
* CSV import/export handled fully in the browser
* UI language: German
* UI framework: Nuxt UI (https://ui.nuxt.com/llms.txt)
* Clipboard handling via https://vueuse.org/core/useClipboard

---

## 2. High-Level Architecture

### 2.1 Rendering Mode

* All pages/components for this feature use client components only.
* Disable SSR where necessary (`definePageMeta({ ssr: false })` if needed).

### 2.2 State Management

Use a composable as a lightweight client-side store:

* `composables/useVolunteers.ts`
* Reactive state using `ref` / `computed`
* Persist and hydrate from `localStorage` (via the reactive `useLocalStorage` composable)

---

## 3. Data Model

### 3.1 Volunteer

```ts
interface Volunteer {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string
  groups: string[]   // group ids
  notes: string
  createdAt: string
  updatedAt: string
}
```

### 3.2 Group

```ts
interface Group {
  id: string
  name: string
  createdAt: string
}
```

### 3.3 Root Storage Structure

```ts
interface StorageSchema {
  volunteers: Volunteer[]
  groups: Group[]
}
```

Stored under a single `localStorage` key, e.g.:

```
zoo-volunteer-manager
```

---

## 4. Core Features

### 4.1 Volunteer Management

Features:

* Create volunteer
* Edit volunteer
* Delete volunteer
* Search (by name, email, notes)
* Assign to one or multiple groups

UI Components (Nuxt UI):

* Form: `UForm`, `UInput`, `UTextarea`, `USelect`, `UButton`
* `UTable` for listing volunteers
* `UModal` for editing

Search:

* Client-side filtering via computed property
* Debounced search input (optional)

---

### 4.2 Group Management

Features:

* Create group
* Rename group
* Delete group
* Assign volunteers to groups (from volunteer form and table view)

Constraints:

* Prevent duplicate group names
* On group deletion, remove group reference from all volunteers (requires user confirmation)

---

### 4.3 Email Selection & Copy

Requirements:

* Select individual volunteers
* Select all volunteers in one or multiple groups
* Display selected emails in a text field
* Copy button using `useClipboard`

Implementation:

* Maintain `selectedVolunteerIds: Ref<string[]>`
* Derived computed:

  * `selectedEmails`
  * Deduplicated email list

Output field:

* `UTextarea` (readonly)
* Emails separated by comma for easy pasting into email clients

Copy:

```ts
const { copy, copied } = useClipboard()
```

Button triggers `copy(selectedEmails.value)`.

---

### 4.4 CSV Import

* File input (`accept=".csv"`)
* Parse client-side (via csv-stringify and csv-parser npm packages)
* Expected columns:

  * firstname
  * lastname
  * email
  * phone
  * groups (comma separated)
  * notes

Import Logic:

* Create missing groups automatically
* Generate IDs
* Validate email format
* Skip duplicates (optional rule: unique by email)

Error handling:

* Show summary (imported / skipped / errors)

---

### 4.5 CSV Export

* Export all volunteers
* Flatten group names into comma-separated string
* Generate CSV string
* Create Blob
* Trigger download via anchor element

Filename example:

```
freiwillige-helfer-osnabrueck.csv
```

---

## 5. UI Structure

### Page Structure

```
pages/
  volunteers.vue
```

Main layout sections:

1. Header (Titel + Aktionen)
2. Search bar
3. Volunteer list
4. Group management panel
5. Email selection panel
6. CSV import/export section

---

## 6. Local Storage Strategy

### Initialization

* On composable init:

  * Load from `localStorage`
  * Validate structure
  * Fallback to empty arrays

### Persistence

* `useLocalStorage` from `@vueuse/core` handles reactive syncing

---

## 7. Validation Rules

* Firstname: required
* Lastname: required
* Email: required, unique, valid format
* Phone: optional
* Group name: required, unique

Validation handled via Nuxt UI form validation.

---

## 8. UX Details

* All UI labels in German
* Clear primary actions
* Confirmation dialog before deletion
* Visual feedback after copy
* Responsive layout

---

## 9. Optional Enhancements (Future)

* Tag-style group chips
* Bulk select / select all
* Export selected only

---

## 10. Implementation Order

1. Create composable with persistence
2. Implement volunteer CRUD
3. Implement group CRUD
4. Implement search
5. Implement selection + email copy
6. Add CSV export
7. Add CSV import
8. Polish UI & validation

---

End of Plan
