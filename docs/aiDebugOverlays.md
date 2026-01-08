# AiStrategicDebugOverlays

> Purpose: Define **what internal Strategic AI state must be inspectable** for developers (and optionally players) to ensure explainability and debuggability.

---

## 1. Design Principles

Debug overlays must:
- Reflect *actual decision inputs*, not post‑hoc rationalizations
- Be read‑only
- Never expose hidden information the AI should not know
- Be deterministic per turn

If an overlay would change AI behavior by being visible, it is invalid.

---

## 2. Visibility Tiers

### Tier 0 — Internal (Developer Only)
- Full weights
- Raw scores
- Thresholds
- Personality modifiers

### Tier 1 — Advanced Debug (Optional Player)
- Agenda evaluations
- Escalation logic
- Reputation scars

### Tier 2 — Player‑Facing Hints
- High‑level intent summaries
- Public commitments
- Known risk posture

---

## 3. Core Overlay Panels

### 3.1 Strategic Summary Panel

Always visible in debug mode.

Contents:
- Active agendas (with remaining influence drain)
- Primary victory path
- Fallback victory path
- Current personality profile
- Collapse risk estimate

---

### 3.2 Agenda Evaluation Panel

For each active agenda:
- Success conditions (static)
- Current progress
- Estimated remaining turns
- Estimated opposition strength
- Status: On Track / At Risk / Failing

Explicitly show **why** an agenda is failing.

---

### 3.3 Incident & Escalation Panel

For each relevant incident:
- Escalation stage
- Influence wagered (self / others)
- Known supporters and opponents
- Back‑down threshold

Must show:
- What would cause escalation
- What would cause withdrawal

---

### 3.4 Reputation & Memory Panel

For each known faction:
- Numeric relation value
- Active reputation scars
- Scar decay timers

Scars must include:
- Source event
- Severity
- Remaining duration

---

### 3.5 Treaty Integrity Panel

For each treaty:
- Benefits gained
- Obligations owed
- Honor weight
- Break cost (reputation + internal)

Breaking a treaty must always show a **cost preview**.

---

### 3.6 Collapse & Recovery Panel

Shows:
- Internal unrest trajectory
- Influence sustainability
- Overextension score
- Collapse probability

Must clearly indicate when collapse is:
- Imminent
- Acceptable
- Strategically beneficial

---

## 4. Temporal Debugging

The system must support:
- Turn‑by‑turn replay of Strategic decisions
- Inspection of past snapshots

Minimum requirement:
- Last 10 turns per AI player

---

## 5. Logging Requirements

Every Strategic tick must emit structured logs for:
- Agenda creation / escalation / failure
- Incident escalation decisions
- Treaty changes
- Victory path switches
- Collapse decisions

Logs must reference:
- Checklist step number
- Personality influence
- Key thresholds crossed

---

## 6. Player‑Facing Explainability (Optional)

If enabled, players may see:
- "This faction is pursuing X"
- "This faction is unwilling to escalate"
- "This faction considers collapse preferable"

Never show:
- Numeric thresholds
- Internal weights
- Hidden alternatives

---

## 7. Forbidden Debug Practices

Never:
- Auto‑correct AI behavior based on debug views
- Hide information to make AI look smarter
- Change decisions after logs are written

Debug tools must reveal flaws, not mask them.

---

## Final Invariant

At any moment, a developer must be able to trace:

> Strategic state → Checklist step → Decision → Outcome

If this chain breaks, the AI system is incomplete.

