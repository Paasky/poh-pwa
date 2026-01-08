# AI Strategic Incidents

## Purpose
Define the Incident system as the shared backbone of:
- Agendas
- Diplomacy
- Religion
- Espionage
- War

Incidents make conflict legible.
They are staged, public disputes that can be resolved, conceded, or escalated.

---

## Core Principles

- Incidents are **public**
- Incidents are **scoped** (owner, target, city/claim)
- Incidents are **staged** (poker-like escalation)
- Incidents require **presence** to act (diplomats / missionaries / spies)
- Incidents are **deterministic** (no random outcomes)

War is the terminal escalation state of a **Major Incident**.

---

## Incident Types

Incidents come in two tiers.

### Minor Incidents
- May occur **without** an agenda
- Usually local and city-scoped
- Lower stakes
- Can only:
  - Resolve
  - Escalate into a Major Incident by attaching to an agenda

Typical sources:
- Missionary entry denial
- Religious tension
- Border friction
- Diplomatic snubs

---

### Major Incidents
- Must be linked to an **agenda**
- Higher stakes and visibility
- Can escalate up to war

Typical sources:
- Agenda-driven demands and refusals
- Treaty violations
- Sustained provocation

---

## Incident Structure

Each incident has:
- **Owner** (initiator)
- **Target** (primary opponent)
- **Scope** (city / border / access / treaty / religion / culture)
- **Linked Agenda** (required for Major, optional for Minor)
- **Escalation Level** (0–3)
- **Participants**
  - Supporters of Owner
  - Supporters of Target
- **Committed Stakes**
  - Influence commitments per participating faction
  - Faith commitments where applicable

---

## Presence Rules (Agents)

Incidents are grounded by city-level presence.

### Diplomat
- Cost: **Influence upkeep**
- Visibility: public
- Required to:
  - Create Major Incidents
  - Join incidents publicly
  - Escalate incidents
  - Propose and sign resolutions

### Missionary
- Cost: **Faith**
- Visibility: public
- Consent: requires access (except in vassal territory)
- Can:
  - Create Minor Incidents via entry denial
  - Raise or lower tension based on state religion alignment
  - Provide justification for later escalation

### Spy
- Cost: **Influence upkeep**
- Visibility: hidden until detected
- Can:
  - Enable incidents by destabilizing cities
  - Increase tension and accelerate escalation readiness
  - Provide intelligence

Spies cannot directly start incidents or escalate to war.

---

## Vassal and Confederation Rules

### Vassals
- Missionaries may operate in vassal territory without needing consent.
- Overlords may meddle in vassal incidents and agendas without needing diplomats.

### Confederation Policy
- Vassals/states manage internal policy.
- Overlord manages foreign affairs.
- Incidents involving external parties may be handled by the overlord.

---

## Tension Meter

Each city (or defined local scope) has a visible tension state:

- Calm
- Trust
- Suspicion
- Alarm

Tension is used to:
- Guide player attention
- Allocate AI computation budget
- Gate escalation readiness

### Sources of Tension Change

- Missionaries:
  - Increase tension when acting against state religion
  - Lower tension when reinforcing the same religion
- Spies:
  - Increase tension via unrest/policy manipulation
  - May spike directly to Alarm after detected hostile missions
- Diplomats:
  - Lower tension via negotiations and concessions
- Treaty changes:
  - Breaking promises increases tension

---

## Escalation Ladder

Escalation is poker-like with simultaneous choices.

### Levels
- **0: Tension**
  - Incident exists, no commitments required
- **1: Diplomatic Pressure**
  - Influence committed
  - Demands and public positioning
- **2: Coercion**
  - Larger commitments
  - Embargoes, expulsions, access denial enforcement
- **3: War** (Major Incidents only)
  - Military conflict

Minor incidents may not escalate to war.
They must first convert into a Major Incident by attaching to an agenda.

---

## Commitments and Stakes

### Influence
- Committed (locked), not refunded
- Lost only on unfavorable resolution
- Commitment scale should be proportional to current influence income (era-relevant)

### Faith
- Used primarily for missionaries and religious pressure
- May be committed as part of religious incidents

Running out of influence disbands influence-upkeep agents first.

---

## Resolution Logic

Incident escalation uses a poker-like simultaneous choice model:

- **Raise** (Escalate)
- **Call** (Match / wait)
- **Fold** (Back down)

Choices are made simultaneously by Owner and Target (supporters commit via their chosen side).

### Stakes
- Stakes are defined as **committed influence** (and where applicable, committed faith pressure).
- Committed influence is **locked** until the incident resolves.
- Payoffs transfer **committed influence** between sides (no value creation/destruction).

### Payoff / Transition Matrix

All percentages below refer to **currently committed influence** for the incident stage.

- **Fold + Fold**
  - Status quo
  - 100% of committed influence refunded to both sides
  - Incident ends

- **Fold + Call**
  - Folder loses 25% of their committed influence
  - Caller gains that 25%
  - Incident ends (status quo outcome)

- **Fold + Raise**
  - Folder loses 50% of their committed influence
  - Raiser gains that 50%
  - Escalation advances 1 level

- **Call + Call**
  - No immediate payoff transfer
  - Incident remains at current escalation level
  - Escalation clock advances (see below)

- **Call + Raise**
  - No immediate payoff transfer
  - Escalation advances 1 level

- **Raise + Raise**
  - No immediate payoff transfer
  - Escalation advances 1 level

### Escalation Clock and Forced Settlement

- Each escalation level has a finite **clock**.
- Each turn where the incident does not resolve (including Call+Call), the clock advances.
- When the clock expires, the incident resolves via **forced settlement** (never forced escalation).

Forced settlement:
- Ends the incident at the current escalation level.
- Produces a status-quo or limited-concession outcome based on:
  - current escalation level
  - agenda linkage (minor vs major)
  - committed stakes and participation

---

## Aggressor Tagging

When escalation advances into a Major Incident stage that can lead to war (and especially when war is triggered), one side may be tagged as the **Aggressor**.

### Definition
A faction is tagged as **Aggressor** if it is the side that:
- **Raises** while the opposing primary side **Calls** or **Folds** at the final pre-war escalation level, thereby triggering war progression, or
- Issues the war-triggering raise that advances the incident into **War** without a matching raise from the opposing primary side in that same step.

If both primary sides **Raise** on the final pre-war step (mutual escalation), there is **no Aggressor tag**.

### Effects
Aggressor tagging applies:
- Additional relation penalties with neutral and opposing factions
- Increased war weariness for the Aggressor
- Reduced willingness of third parties to support the Aggressor in related incidents

Aggressor tagging is purely a diplomatic/reputation effect. It does not modify combat mechanics.

---

## Entry Denial and Removal Timers ("Leave now")

Closing borders or revoking access triggers a timed removal sequence.

Applies to:
- Diplomats
- Missionaries
- Military units

Rule:
- Affected pieces receive a grace period to leave.
- Failure to leave by the deadline escalates tension and may trigger or escalate an incident.

This prevents teleportation behavior and enables historical-style escalation.

---

## Diplomacy Integration

Incidents are the primary consequences of:
- Refusing demands
- Refusing gifts
- Breaking treaties
- Denying access

Diplomacy UI must display:
- Incident risk
- Escalation risk
- Who can act (presence)

---

## Strategic AI Integration

Strategic AI uses incidents to:
- Decide when to back down vs escalate
- Allocate diplomats/spies/missionaries
- Predict coalition behavior via public participation
- Convert Minor incidents into Major incidents via agendas

Incidents are the primary tool for making AI behavior explainable.

---

## Hard Constraints

- Minor incidents cannot escalate to war
- Major incidents require a linked agenda
- Public actions require a diplomat present
- Missionary entry denial may create minor incidents
- Spies cannot directly trigger incidents or war

---

## Design Intent

This system exists to:
- Replace hidden diplomatic math with visible staged conflict
- Give diplomacy and religion physical, city-anchored gameplay
- Produce legible escalation arcs without RNG

If escalation cannot be explained by incident state and presence rules, it is a bug.

