# AI Strategic Agendas

## Purpose
Define the **Agenda system** used by both AI and human players.
Agendas are public, binding declarations of intent that:
- Predict behavior
- Anchor diplomacy and incidents
- Drive escalation and victory paths

Agendas are not tasks or scripts. They are **claims on the future**.

---

## Core Principles

- Agendas are **public** and **binding**
- Agendas consume **influence output** over time
- Agendas create **expectations and reactions**
- Agendas are the primary driver of incidents and wars
- Agendas explain *why* actions happen, not *how*

---

## Agenda Slots

- Players start with **1 agenda slot**
- Gain **+1 agenda slot per 10 technologies researched**
- Maximum agenda slots: **3**

This ensures:
- Predictable growth in diplomatic complexity
- No late-game overload

---

## Agenda Scale

Agendas exist in two scales.

### Minor Agendas
- Influence drain: **20% of output** (clamped)
- Preparatory or supportive in nature
- Lower penalties on failure
- Often enable Major agendas

Examples:
- Olympics
- Tournaments
- World’s Fair
- Security Council

---

### Major Agendas
- Influence drain: **40% of output** (clamped)
- Epoch-defining or victory-linked
- High penalties on failure
- Trigger global attention

Examples:
- Colonial Empire
- The Great War
- Cultural Singularity

---

## Agenda Classes

Agendas are grouped by **what dimension of the world they seek to reshape**.

### 1. Internal Development
> “I am changing myself.”

Focus:
- Economy
- Society
- Institutions

Pressure Applied:
- Happiness / Order
- Corruption
- Policy alignment

Failure Consequences:
- Crisis acceleration
- Reform or civil war

Examples:
- First Cities
- Urban Society
- Industrial Might

---

### 2. External Projection
> “I am changing my position relative to others.”

Focus:
- Territory
- Trade
- Military power

Pressure Applied:
- Incidents
- Treaties
- War score

Failure Consequences:
- Reputation damage
- Coalition pressure

Examples:
- Trade Network
- Colonial Empire
- World Domination

---

### 3. Ideological / Systemic
> “I am changing how the world works.”

Focus:
- Culture
- Religion
- Global norms

Pressure Applied:
- Cultural / religious spread
- Diplomatic modifiers
- Global reactions

Failure Consequences:
- Isolation
- Counter-agendas

Examples:
- Pantheon of Gods
- The Enlightenment
- One True Faith

---

## Agenda Lifecycle

All agendas follow the same lifecycle.

1. **Declared**
   - Public announcement
   - Influence drain begins

2. **Contested**
   - Diplomatic responses
   - Incidents may trigger

3. **Escalated**
   - Influence is wagered
   - Coercion or war possible

4. **Resolved**
   - Fail
   - Partial success
   - Full success
   - Escalate (repeat lifecycle at higher stakes)

5. **Aftermath**
   - Reputation scars applied
   - Cooldowns enforced
   - Possible crisis effects

---

## Minor → Major Upgrading

- Minor agendas may be **upgraded into Major agendas**
- Upgrade:
  - Replaces the Minor agenda
  - Increases influence drain
  - Raises stakes and penalties

This represents:
- Escalation of ambition
- Increased global visibility

---

## Agenda Failure & Success

### Failure
- No rewards granted
- Penalties applied
- Reputation scars added
- Cooldown triggered

### Partial Success
- Reduced rewards
- Reduced penalties
- Agenda ends

### Full Success
- Full rewards
- May count toward victory conditions
- Agenda ends

Success conditions are **fixed at creation** and never change.

---

## Interaction with Diplomacy

Agendas directly affect diplomacy.

### Deal Evaluation
- Agendas modify deal values
- Certain refusals may trigger incidents

Example:
- Refusing Open Borders during a Colonial Empire agenda may escalate

---

### Demands & Gifts

Diplomatic actions are interpreted through agendas:
- Demands become credible when aligned with agendas
- Gifts may defuse agenda-driven pressure

The UI must explicitly surface agenda-related risk.

---

## Global Awareness

Agendas do **not** guarantee opposition.

However:
- All players observe declared agendas
- Each player evaluates whether to care
- Support and opposition emerge organically

---

## Strategic AI Usage

Strategic AI uses agendas to:
- Select long-term goals
- Predict diplomatic reactions
- Justify escalation or restraint
- Communicate intent to the player

Agendas are the AI’s primary narrative tool.

---

## Hard Constraints

- Max 3 agendas active
- Influence cannot go negative
- Agendas cannot be hidden
- Agendas cannot be silently canceled

---

## Design Intent

This system exists to:
- Make strategy legible
- Make diplomacy reactive
- Make escalation understandable
- Prevent random or opaque behavior

If an action cannot be explained by an agenda, it should not occur.

