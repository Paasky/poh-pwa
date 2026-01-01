# Project Bible

This document defines the **core rules, values, and constraints** of the project.

It is the single source of truth for:

* Architecture decisions
* Code quality standards
* UI/UX consistency
* Peer‑review enforcement

If a request or change conflicts with this document, **stop immediately and push back**.

---

## 1. Core Principles

1. **KISS, DRY & Performance**
   Simplicity is beauty. Prefer clear, boring solutions that perform well.

2. **Industry Standards First**
   Follow common, battle‑tested practices unless there is a strong reason not to.

3. **Fix Problems, Don’t Work Around Them**
   No wild hacks. If something is wrong, fix or remove it.

   During task hand‑off or development, **nothing is sacred**:

    * No contract is final
    * Any code may change after peer discussion
    * Half‑measures are forbidden

4. **Readable Code**

    * No cryptic 1–2 letter variables
        * Exceptions: y for yield (reserved word); i in for-loop index
    * Be explicit and descriptive
    * Use proper English

5. **TypeScript Discipline**

* No `any` casting
* **Exception:** very rare, well-justified cases where the IDE or TypeScript produces false positives
* Such exceptions **must include a comment** explaining why `any` is required
* Types exist to help us — use them precisely

6. **Type Reuse**

    * Do not create new I/O types unless necessary
    * Reuse existing types when possible
    * Leave a comment if you believe a new type is required

7. **No Helper Duplication**

    * Shared math or helpers belong in common utilities
    * Local duplication is only acceptable for tiny, self‑contained logic

8. **Testing Philosophy**

    * No mocking by default
    * Tests must reflect real behavior

   Allowed exceptions:

    * `Math.random` via faker for deterministic tests
    * Stateless Babylon engine if required
    * External interactions (network, file I/O)

9. **Import Hygiene**

    * Always verify all imports exist in all modified files

10. **Mandatory Pushback Rule**
    If a request violates any rule in this document:

* Stop immediately
* Explicitly state which rule would be broken
* Especially enforce KISS and common practices

---

## 2. UI & UX Principles

UI/UX decisions must support:

* Clarity in data-dense screens
* Predictable interaction patterns
* Minimal visual noise

Consistency is intentional and enforced via shared components and peer review.

---

## 3. UI Abstraction Principles

* UI abstractions exist to reduce cognitive load, not to increase flexibility
* Shared UI components must be opinionated and documented
* Feature code must not introduce new visual language lightly

Detailed UI migration rules, Ui* component APIs, layout systems, and animation policies live in the **UI Consolidation &
UX Refinement** document.

---

## 4. Enforcement

This document is enforced via:

* Peer review
* Centralized UX authority
* Zero tolerance for "just this once" exceptions

The goal is long‑term clarity, not short‑term convenience.
