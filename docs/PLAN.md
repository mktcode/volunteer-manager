# Volunteer Management App – MVP Implementation Plan

## 1. Scope and Constraints

- Nuxt 4 application.
- Client-side only for this feature set (no server routes, no backend persistence).
- Data persistence via `localStorage` using `useLocalStorage`.
- Clipboard copy via `useClipboard`.
- CSV import/export fully in the browser.
- Vaidation via `zod`.
- UI language: German.
- UI framework: Nuxt UI only.
- Keep implementation minimal: no extra pages, no extra features beyond this plan.
- Package manager: npm only.

---

## 2. MVP Decisions (Simplified)

- The volunteer manager replaces the current home page (`/`) in `app/pages/index.vue`.
- One composable store for all feature state (`composables/useVolunteers.ts`).
- One `localStorage` root key (`volunteer-manager`).
- Group CRUD is included (create, rename, delete).
- Email uniqueness is a hard global rule (manual create/edit and CSV import).
- Future ideas from `docs/DISCUSSION.md` stay out of scope.

---

## 3. Data Model

```ts
interface Volunteer {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string
  groups: string[] // group ids
  notes: string
}

interface Group {
  id: string
  name: string
}

interface StorageSchema {
  volunteers: Volunteer[]
  groups: Group[]
}
```

Notes:
- `createdAt` / `updatedAt` are not required for MVP.
- IDs can be generated client-side with a simple deterministic approach.

---

## 4. State Management

Create `composables/useVolunteers.ts` as the single source of truth.

State:
- `volunteers`
- `groups`
- `selectedVolunteerIds`
- `searchQuery`

Derived:
- `filteredVolunteers` (search in first name, last name, email, notes)
- `selectedEmails` (deduplicated, comma-separated)

Actions:
- Volunteer CRUD
- Group CRUD
- Assign/unassign groups on volunteers
- Selection helpers (toggle one, clear all, select by group)
- CSV import/export helpers

Persistence:
- `useLocalStorage<StorageSchema>('volunteer-manager', { volunteers: [], groups: [] })`
- Defensive fallback if loaded data shape is invalid.

---

## 5. UI Structure (Single Page)

Target file:
- `app/pages/index.vue`

Sections (in this exact order):
1. Header (title + primary actions)
2. Search input
3. Group management panel
4. Volunteer table
5. Email selection + copy panel
6. CSV import/export panel

Nuxt UI components (minimal set):
- `UForm`, `UInput`, `UTextarea`, `USelect` (or `USelectMenu`), `UTable`, `UModal`, `UButton`

No additional pages, dashboards, filters, or optional UX enhancements.

---

## 6. Feature Requirements

### 6.1 Volunteer Management

- Create, edit, delete volunteers.
- Assign one or multiple groups.
- Search client-side via computed filtering.

### 6.2 Group Management

- Create, rename, delete groups.
- Prevent duplicate group names (case-insensitive trim check).
- On group deletion, remove group id from all volunteers.
- Require user confirmation before deletion.

### 6.3 Email Selection and Copy

- Select individual volunteers.
- Select all volunteers for one or multiple groups.
- Show resulting emails in a readonly textarea.
- Copy button uses:

```ts
const { copy, copied } = useClipboard()
```

### 6.4 CSV Import (Browser Robust)

- Use one browser-focused CSV library (recommended: Papa Parse).
- File input accepts `.csv`.
- Expected columns:
  - `firstname`
  - `lastname`
  - `email`
  - `phone`
  - `groups` (comma-separated group names)
  - `notes`

Import behavior:
- Validate required fields and email format.
- Enforce global unique email rule.
- Auto-create missing groups from parsed group names.
- Add valid rows, skip invalid/duplicate rows.
- Show summary: `imported`, `skipped`, `errors`.

### 6.5 CSV Export

- Export all volunteers.
- Convert group ids to group names, joined by comma.
- Generate CSV in browser and trigger download.
- Filename:
  - `freiwillige-helfer-osnabrueck.csv`

---

## 7. Validation Rules (MVP)

- `firstname`: required
- `lastname`: required
- `email`: required, valid format, globally unique
- `phone`: optional
- `group.name`: required, unique

Validation is enforced in form handlers and import logic.

---

## 8. Implementation Order

1. Build `useVolunteers` composable with local storage persistence.
2. Replace `app/pages/index.vue` with MVP layout sections.
3. Implement volunteer CRUD + validation.
4. Implement group CRUD + cascading cleanup on delete.
5. Implement search filtering.
6. Implement selection state + email copy.
7. Implement CSV export.
8. Implement CSV import + summary reporting.
9. Final polish of German labels and confirmations.

---

## 9. npm-Only Commands

Install CSV dependency (when implementing):

```bash
npm install papaparse
```

Validation commands:

```bash
npm run lint
npm run typecheck
```

---

## 10. Explicit Non-MVP Scope

Do not implement now:
- Cloud storage/sync
- Built-in email sending
- Public announcements website
- Any additional pages or optional enhancements

---