# UI Consolidation & UX Refinement Epic

This document defines the **scope, rules, and execution plan** for consolidating the UI into a consistent, opinionated
system.

It is **time-bound and task-specific**. Long‑term rules live in the Project Bible.

---

## 1. Epic Goal

Replace ad‑hoc MVP UI with a **unified, low‑noise, data‑dense UX** suitable for a 4X strategy game.

This epic intentionally trades flexibility for:

* Predictability
* Visual consistency
* Reduced cognitive load
* Easier global refactors

Breaking changes and large refactors are **expected and encouraged**.

Backwards compatibility is **explicitly not a goal**.

---

## 2. Guiding Constraints (Epic‑Specific)

During this epic:

* UI decisions favor **consistency over local optimization**
* Vuetify is treated as an implementation detail, not a design surface
* If something does not fit existing Ui*, the Ui* layer evolves
* "Just for this one task" UI is strongly discouraged and peer‑gated

Raw Vuetify usage is allowed **only** in spike / prototype work, or by explicit peer agreement.

---

## 3. Phase 1 — Core UI Infrastructure

### 3.1 Icon System Consolidation

**What**
Centralize all system‑level icons behind semantic keys.

**Why**

* Prevent missing or inconsistent icons
* Decouple UI code from icon libraries
* Enable global icon changes

**Where**
`src/types/icons.ts`

**Tasks**

* Audit all icons currently in use
* Register missing system icons (e.g. save, load, undo, redo, close, settings, menu, search)
* Ensure no feature code references raw icon strings

---

### 3.2 UiIcon

**What**
A strict wrapper around icon rendering.

**Why**

* Enforce semantic icon usage
* Prevent silent icon failures

**Where**
`src/components/Ui/UiIcon.vue`

**Rules**

* Must resolve icons via `getIcon(iconKey)`
* Must emit `console.warn` if an icon key is missing or resolves to fallback
* **Implementation:** Use `v-icon` internally but do not expose raw `v-icon` props.

**API**

* `icon`: `IconKey` (from `src/types/icons.ts`, required)
* `size`: `xs | sm | md | lg`
* `color`: `string` (Vuetify color or hex)

---

### 3.3 UiButton Refactor

**What**
Refactor UiButton to exclusively use UiIcon.

**Why**

* Remove raw `<v-icon>` and `fa-*` usage
* Guarantee consistent button/icon alignment

**Where**
`src/components/Ui/UiButton.vue`

**Tasks**

* Change `icon` prop type from `string` to `IconKey`
* Replace internal `<v-icon>` with `<UiIcon :icon="icon" />`
* Ensure `iconColor` and `size` are passed through to `UiIcon` correctly
* Remove all Font Awesome class string logic

---

### 3.4 Form Input Standardization

**What**
Introduce opinionated wrappers for common form inputs.

**Why**

* Uniform look across all configuration and settings UIs
* Reduced per‑screen decision‑making

**Standard Implementation Rules**

* All components MUST use `defineModel<T>()` for value binding.
* Labels are MANDATORY for accessibility and consistency.
* No `variant` or `density` overrides in the consumer; these are locked in the `Ui*` component.

**Components**
`src/components/Ui/`

* **UiSwitch**

    * `inset`
    * `color="primary"`
    * Required `label`

* **UiSlider**

    * `color="primary"`
    * Required `label`
    * `ticks`: `null | show | labels`
    * `thumb-label`: `true` (standardized)

* **UiSelect**

    * `variant="outlined"`
    * `density="comfortable"`
    * Required `label`
    * `items`: `{ title: string, value: any }[]`

No passthrough styling or variant overrides.

---

## 4. Phase 2 — Shell & Navigation Primitives

### 4.1 UiDialog

**What**
A reusable dialog shell with optional search support.

**Why**

* Consistent modal chrome
* Shared interaction patterns
* Centralized dialog behavior

**Where**
`src/components/Ui/UiDialog.vue`

**Responsibilities**

* Render dialog structure (v-card based)
* Emit search input when enabled
* Standardize close button position and behavior

**Non‑Responsibilities**

* No data fetching
* No search logic
* No result interpretation

**API**

* `v-model` (boolean, visibility)
* `title` (string, required)
* `searchable` (boolean, default false)
* `v-model:search` (string, for persistent search state)

**Slots**

* `default` (main content)
* `actions` (footer buttons)
* `header-append` (top-right area next to title/search)

**Standard Persistence:** Each feature decides how to implement search state persistence (e.g., local ref, Pinia, or
local storage). `UiDialog` only provides the `v-model:search` binding.

---

### 4.2 UiTabs (Folder Style)

**What**
Opinionated tab container with folder‑style visuals.

**Why**

* Strong visual grouping
* Reduced visual noise

**Where**
`src/components/Ui/UiTabs.vue`

**Rules**

* Visual component only
* No routing or persistence (State handling lives in the consumer)
* **Visuals:** Active tab uses `primary` background. Top corners rounded only.
* **Implementation:** Use **custom CSS** inside the component to achieve the folder look (KISS & DRY), rather than
  complex Vuetify prop manipulation.

**API**

* `v-model` (active tab value)
* `items`: `{ label: string, value: string, icon?: IconKey }[]`

---

### 4.3 UiList

**What**
A minimal wrapper for flat lists.

**Why**

* Standardize density and interaction
* Avoid per‑list tweaking

**Where**
`src/components/Ui/UiList.vue`

**API**

* `items`: `any[]`
* Default slot for custom item rendering.
* Standardized `density="compact"` and spacing.

---

## 5. Phase 3 — Feature Migration

### 5.1 Settings Dialog

**Where**
`src/components/Settings/SettingsDialog.vue`

**Tasks**

* Replace raw Vuetify components with Ui* equivalents
* Remove local styling overrides

---

### 5.2 Encyclopedia

**Where**

* `EncyclopediaDialog.vue`
* `EncyclopediaMenuItem.vue`

**Tasks**

* Wrap dialog with UiDialog
* Move toolbar, chips, and actions into UiDialog slots
* Replace icons with UiIcon
* Keep recursion and data logic local

Search result limiting (e.g. top 25) remains feature‑specific.

---

### 5.3 Player Details

**Where**
`src/components/PlayerDetails/PlayerDetailsDialog.vue`

**Tasks**

* Migrate to UiDialog
* Use UiTabs for folder‑style navigation
* Keep router synchronization in the consumer

---

### 5.4 Terra Config

**Where**
`src/views/Home/TerraConfigDialog.vue`

**Tasks**

* Replace sliders and selects with UiSlider / UiSelect
* Remove per‑control styling decisions

---

## 6. Phase 4 — Cleanup & Enforcement

### 6.1 Global Icon Replacement

* Replace all `<v-icon>` usage with `<UiIcon>`
* Ensure all referenced icons exist in `icons.ts`

---

### 6.2 Layout Consolidation

**What**
Replace ad‑hoc layout logic with shared abstractions.

**Tasks**

* Audit `v-row` / `v-col` usage
* Replace with UiGrid / UiCols where applicable
* **Refactor `UiGrid`**: Remove `any[]` typing. Items should be a generic type `T[]`. No additional interfaces (like
  `Identifiable`) are required.
* **Refactor `UiCols`**: Ensure it handles 12-column grid mathematically (e.g., `cols.left + cols.right === 12`
  enforcement).

**Rules**

* Layout components own all internals (spacing, gutters, responsive breakpoints)
* Public API is enum‑based or strict numeric ranges (no raw CSS strings)
* No CSS or layout hacks allowed in feature code

---

## 7. Definition of Done

This epic is complete only when:

* All checklist items are merged into `master`
* No feature UI depends on raw Vuetify where Ui* exists
* Ui* components are consistently used
* No local styling overrides remain

At this point, the UI layer is considered **locked down**.
