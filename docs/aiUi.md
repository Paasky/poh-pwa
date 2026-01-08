# AI Strategic UI Contracts

## Purpose
Define **what information is surfaced to the player**, **when**, and **at what priority**, ensuring clarity without overload.

These contracts apply symmetrically to human and AI-controlled players.

---

## Core Principle

> Show intent, commitment, and consequence. Hide calculation.

The UI exists to help the player:
- Predict behavior
- Make informed decisions
- Understand outcomes after the fact

---

## Notification Layers

### 1) Splash (Blocking)

Used only for events that require **immediate player attention** or invalidate current decisions.

Triggers:
- Forced incident responses
- Agenda opposition or escalation
- City entering Suspicious / Alarmed state
- Tech, policy, dogma, or production selection

Rules:
- Only one splash shown at a time
- Multiple splashes are queued
- All unresolved splashes appear in the "Next Item To Do" list

---

### 2) Notification Feed

Side-scroller list of relevant but deferrable events.

Triggers:
- Agenda pressure
- Incident escalation affecting player interests
- Border incidents
- Reputation shifts
- Agent success/failure

---

### 3) Other / World Info

Collapsed information panel for awareness only.

Triggers:
- Distant incidents
- Third-party treaties
- Global shifts without direct player impact

---

## Information Structure

All surfaced events must present exactly four fields:

- **Who** is involved
- **What** happened
- **Concern** (why it matters to you)
- **Where** it occurred

No raw numbers are shown unless the player drills down.

---

## AI Indirect Intent Visibility

AI intent changes are surfaced only by **relevance**:

- Splash: AI actions directly affecting your agendas or incidents
- Notification: AI actions affecting players you have reason to care about
- Hidden: All other AI intent shifts

AI personality axes are shown statically; dynamic stance modifiers appear only in tooltips.

---

## Non-Intervention Feedback

When the player chooses not to act:
- No splash is shown
- A factual log entry is created

Example:
"Trade Embargo Incident escalated. You did not intervene."

---

## Priority Resolution

If multiple splash events occur:
- They are resolved sequentially
- Remaining splashes are queued in "Next Item To Do"

Splash events never silently downgrade.

---

## Difficulty Interaction

Difficulty affects **what signals the AI reacts to**, not what the player sees.

- Easy AI reacts only to Splash signals
- Normal AI reacts to Splash + Notification signals
- Hard AI reacts to Splash + Notification + relevant Info signals
- Brutal AI reacts to all signals

---

## Design Intent

This system exists to:
- Preserve late-game readability
- Prevent alert fatigue
- Maintain fairness and symmetry

If an event matters, it is visible. If it is visible, it is actionable or explainable.
