# Fact Sheet — Relations & AI Decision Inputs

This document defines **Relations** as the shared input layer used by both AI and UI to reason about other players.
It contains only factual rules and replaces any implicit or conflicting descriptions elsewhere.

---

## 1. Relations: What It Is

- Relations is a **derived aggregate**, not a primary system.
- Relations is computed from observable facts already defined in other systems.
- Relations is used by:
  - Strategic AI decision-making
  - Player-facing UI summaries

Relations never creates rules and never blocks actions directly.

---

## 2. Purpose of Relations

Relations exists to:
- Compress many signals into a readable overview
- Allow both AI and players to reason about intent and risk
- Avoid hidden or opaque diplomatic math

Relations is a **lens**, not a mechanic.

---

## 3. Relation Facets (Canonical)

Relations is composed of **four independent facets**.
Each facet represents a different reason why another player is friendly, hostile, or dangerous.

### 3.1 Alignment

Represents long-term ideological and structural compatibility.

Inputs include:
- Religion alignment or conflict
- Policy compatibility
- Personality compatibility
- Cultural or ideological similarity

Alignment changes slowly.

---

### 3.2 Trust

Represents confidence in another player’s commitments.

Inputs include:
- Deals kept or broken
- Treaty renewals
- Reputation (Dependability marks)
- Betrayals or sudden reversals

Trust changes based on observed behavior, not promises.

---

### 3.3 Pressure

Represents active attempts to force outcomes without consent.

Inputs include:
- Agendas targeting the player
- Incidents (current or recent)
- Demands, sanctions, or embargoes
- Ongoing diplomatic or religious coercion

Pressure reflects *what they are pushing me to do right now*.

---

### 3.4 Military Power

Represents the ability to coerce through force.

Inputs include:
- Total military strength
- Nearby or relevant military presence
- Force posture relative to borders or incidents

Military Power is evaluated contextually, not globally.

---

## 4. Weighting and Combination

- Each facet contributes independently to Relations.
- Facets are combined via **weights**, not fixed formulas.
- Weights are influenced by:
  - AI personality axes
  - Current difficulty level

No facet is ever ignored entirely.

---

## 5. Personality Interaction

Personality axes modify how facets are valued.

Examples:
- Legalist personalities overweight **Trust**.
- Aggressive personalities overweight **Military Power** and **Pressure**.
- Zealous personalities overweight **Alignment**.

Personality never overrides hard rules; it only biases decisions.

---

## 6. Difficulty Interaction

Difficulty affects **how strongly** Relations influences decisions.

On lower difficulty:
- Weak signals are overlooked
- Only strong facet changes matter
- Reactions are delayed or conservative

On higher difficulty:
- Subtle shifts are noticed
- Multiple facets are combined earlier
- Reactions are faster and more consistent

Difficulty does not grant hidden information.

---

## 7. Output Representation

### 7.1 AI Usage

- AI consumes Relations internally as weighted values.
- Very low combined weights make actions effectively impossible, without being illegal.

---

### 7.2 UI Usage

- UI presents Relations as **words**, not numbers.
- Facets are summarized using qualitative terms such as:
  - aligned / neutral / opposed
  - trusted / unreliable
  - low pressure / heavy pressure
  - weak / intimidating

Players may drill down to see **why** a facet is high or low.

---

## 8. Invariants

- Relations never blocks actions directly.
- Relations uses only observable information.
- AI and players reason from the same inputs.
- Differences arise only from attention and memory, not secret data.

If an AI decision cannot be explained via Relations and its inputs, it is invalid.

