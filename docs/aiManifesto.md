# AI Strategic Manifesto

> Purpose: Define what the Strategic AI **is**, **is not**, and **must always guarantee**.  
> Scope: Strategy-level decision making only. No UI, no pathfinding, no combat micro.

---

## 1. Strategic AI Role

The Strategic AI:

- Operates **above the map**.
- Does **not** issue tile-level or unit-level orders.
- Sets **intent**, **priorities**, and **constraints** for Regional AI.

It reasons in terms of:

- Agendas
- Incidents
- Treaties
- Reputation
- Collapse and recovery
- Victory trajectories

It must appear intentional, fallible, and politically consistent.

---

## 2. Non‑Responsibilities (Hard Boundaries)

The Strategic AI must never:

- Move units
- Optimize combat odds
- Inspect hidden information
- Bypass fog of war
- Create resources or bypass costs
- React instantly to new information

All such behavior belongs to lower layers or explicit difficulty modifiers.

---

## 3. Information Model

The Strategic AI only sees:

- What a human player could know at the same moment
- Public treaties, agendas, incidents
- Known military presence (via vision)
- Known diplomatic history

Allowed advantages:

- Perfect memory of past events
- Faster evaluation

Disallowed:

- Exact enemy yields
- Hidden unit composition
- Future RNG outcomes

Incorrect decisions must arise from **hubris or miscalculation**, not randomness.

---

## 4. Agendas

### Properties

- Max 3 active per player
- Each consumes 30% of influence output
- Influence cost is clamped (10–500)
- If influence reaches 0 → forced agenda cancellation

### Structure

Each agenda defines at creation:

- Owner
- Target (optional)
- Success conditions (fixed, immutable)
- Stakes and penalties
- Escalation ceiling

### Outcomes

- Fail
- Partial success
- Full success
- Escalate → same agenda, higher stakes

Agendas are **binding**. Miscalculation is intentional and permanent.

---

## 5. Incidents

Incidents are **localized conflicts** attached to agendas.

### Rules

- Always owner → target
- Neighbor‑scoped
- Three escalation stages
- Influence is wagered, never refunded

### Game‑Theory Resolution

- Both back down → no loss
- One escalates → other loses wager
- Both escalate → skip stage

War is the **final escalation state** of an incident.

---

## 6. Influence

Influence is:

- Non‑negative
- Non‑stockpilable
- A pacing and commitment resource

Used for:

- Agendas
- Incident escalation
- Treaty pressure
- Diplomatic support

Running out of influence:

- Triggers internal crisis acceleration
- Forces agenda cancellation
- Is a valid strategic tool ("fail fast")

---

## 7. Treaties

Treaties are explicit, asymmetric contracts.

### Acquisition Methods

- Mutual agreement
- Influence payment
- Threat / coercion
- Gift / concession

### Properties

- Public by default
- Some promises may be secret (non‑binding)
- Breaking treaties causes:
    - Reputation scars
    - Long‑term relation penalties
    - Internal stability effects

Ideological alignment increases treaty acceptance probability.

---

## 8. Reputation & Memory

Relations are not a single number.

They consist of:

- Numeric relation score
- Persistent reputation tags ("scars")

Examples:

- Broke promise
- Escalated recklessly
- Backed ally
- Abandoned vassal

Properties:

- Long decay
- Stackable
- Partially purged on revolution or collapse

Strategic AI must consult scars before escalation decisions.

---

## 9. War & Peace

### War

- Is an incident at max escalation
- Has mutable war goals
- Accumulates war score and war weariness

### Peace

- Public negotiation
- Proposal‑based
- Outcomes distributed by war score contribution

Strategic AI must accept suboptimal peace if:

- Agenda is no longer achievable
- Collapse risk exceeds reward

---

## 10. Collapse, Vassalage, Recovery

Collapse is a **valid and expected outcome**.

Effects:

- Removes unrest and corruption pressure
- Triggers cultural evolution
- Resets some reputation scars
- Enables long‑term comeback

Vassals:

- Cannot fight each other
- Auto‑join master's wars
- May start independence agendas

Strategic AI must consider collapse as a **tool**, not a failure.

---

## 11. AI Personality

Each player has a Strategic Personality profile.

Axes include:

- Risk tolerance
- Escalation bias
- Honor / promise‑keeping
- Opportunism
- Ideological rigidity

Assignment:

- Randomized on revolution or collapse
- Stable for an epoch

Personality influences:

- Agenda selection
- Escalation thresholds
- Willingness to back down

No personality may be globally optimal.

---

## 12. Victory Orientation

The Strategic AI must always track:

- One primary victory trajectory
- One fallback trajectory

Victory types:

- Military
- Trade
- Diplomacy
- Religion
- Culture
- Science

Requirements are indirect and multi‑step.

Strategic AI must:

- Prefer clever positioning over raw expansion
- Accept temporary loss of power if it improves end‑state odds

Victory may emerge from dominance, manipulation, or recovery.

---

## 13. Forbidden Anti‑Patterns

This section defines behaviors that must **never** appear in the Strategic AI. Any occurrence is a design or logic bug.

---

### 13.1 Omniscience

The Strategic AI must never:

- React to unseen units, cities, or yields
- Preemptively counter hidden plans
- "Know" the outcome of RNG before resolution

Violations break player trust immediately.

---

### 13.2 Instant Adaptation

The Strategic AI must never:

- Pivot agendas instantly after new information
- Escalate or de‑escalate without a delay
- Cancel agendas the same turn a risk is revealed

Delays represent:

- Political inertia
- Bureaucracy
- Misjudgment

---

### 13.3 Agenda Juggling

Forbidden:

- Rapidly cycling agendas to probe reactions
- Creating agendas with intent to abandon
- Using agendas as information‑gathering tools

Agendas are commitments, not probes.

---

### 13.4 Free Backing‑Down

The Strategic AI must not:

- Back down repeatedly without consequence
- Ignore reputation scars
- Treat influence loss as irrelevant

Backing down is acceptable only if:

- Personality supports it
- Long‑term survival probability improves

---

### 13.5 Dominant Strategy Lock‑In

The Strategic AI must never:

- Discover and repeat a single optimal path
- Always choose expansion, conquest, or trade
- Ignore collapse as a viable option

If one strategy always wins, the system is broken.

---

### 13.6 Eternal Friend / Eternal Enemy

Forbidden:

- Permanent alliances without strain
- Permanent rivalries without re‑evaluation

Relations must drift unless actively maintained.

---

### 13.7 Pile‑On Without Stakes

The Strategic AI must not:

- Join incidents with no agenda relevance
- Support wars that provide no strategic upside
- Dogpile simply because "others are"

All involvement must be justifiable.

---

### 13.8 Collapse Avoidance Bias

Forbidden:

- Treating collapse as game‑over
- Over‑defending a dying empire
- Refusing vassalage when strategically superior

Collapse is a recovery mechanic, not failure.

---

### 13.9 Hidden Rule Exploitation

The Strategic AI must never:

- Exploit implementation details
- Abuse cooldown edge cases
- Rely on numeric thresholds invisible to players

If a human cannot reason about it, the AI must not rely on it.

---

### 13.10 Randomness as Excuse

Forbidden:

- Random agenda selection without rationale
- Coin‑flip escalations
- "Flavor randomness" affecting outcomes

All decisions must be explainable post‑hoc.

---

## Final Invariants

The Strategic AI must always:

- Be explainable via game rules
- Fail for understandable reasons
- Create political narratives
- Respect costs and time
- Never act randomly without cause

If behavior cannot be explained to a player post‑hoc, it is a bug.
