# AI Strategic Diplomacy Model

## Purpose
Define the diplomacy system used by both AI and humans.
Diplomacy is the primary interface for:
- Converting agendas into outcomes without war
- Creating and resolving incidents
- Managing reputation, trust, and long-term scars

Diplomacy is grounded by **city-level presence** (diplomats) and integrates with:
- Agendas (public intent)
- Incidents (staged disputes)
- Reputation (scars)
- Agents (diplomats, missionaries, spies)

---

## Core Principles

- Diplomacy is **bundled deals** (multiple clauses per agreement)
- Deals are **public contracts** by default
- Most public diplomatic actions require a **diplomat present** at the affected city/scope
- Refusals can create incidents (minor or major)
- Deferred obligations are discounted by **trust/credibility**

---

## Presence Requirement

### Diplomat Requirement
Public actions require a diplomat present in the relevant city scope to:
- Propose binding treaties
- Make demands that can trigger incidents
- Join/escalate incidents via diplomacy
- Sign or renew contracts

If no diplomat is present:
- The player may only observe
- Probes/inquiries are allowed but cannot bind or escalate

### Special Cases
- Overlords may act in vassal territory without diplomats (foreign-affairs authority).

---

## Deal Object Model

A deal is a bundle of **clauses**.

### Clause Types

#### One-off (instant)
Executed immediately upon acceptance.
Examples:
- Gold (lump)
- Tech
- Map snapshot
- Resource transfer (instant)
- Stop Wonder
- Outpost / City transfer
- Unit / Unit Design

#### Ongoing (contract)
Executed each turn for a fixed duration.
Default duration: **25 turns**.
Examples:
- Gold per turn
- Trade Slot / Free Trade
- Military Access
- Non-Aggression Pact
- Defense Pact
- Join Alliance
- Incident Support

### Contract Fields
Each ongoing contract includes:
- Start turn
- Duration (default 25)
- Breach consequences (scars + penalties; see below)
- Visibility (public by default)

---

## Diplomatic Interaction Modes (UI/Flow)

Diplomacy uses four explicit modes.

### 1) Probe: “Would you accept this deal?”
- Refusal has no incident consequence
- Intended for exploration

### 2) Inquiry: “What would make this work for you?”
- Receiver returns a counter-template
- No incident consequence

### 3) Gift: “Please accept this gift”
- Receiver may refuse
- Refusal may trigger a **Minor Incident** depending on:
  - current tension
  - relationship level
  - linked agendas

### 4) Demand: “This is my demand!”
- Receiver may refuse
- Refusal triggers:
  - **Major Incident** if agenda-linked and diplomat-present
  - otherwise **Minor Incident**

Counteroffers are delivered on the next turn.

---

## Negotiation Friction

Negotiations may continue indefinitely, but repeated cycles create friction.

- Each rejection or counteroffer increases a hidden scalar: `friction += 1`
- Friction increases:
  - tension in the deal’s scope
  - the minimum value demanded by each side
  - the probability of an incident on refusal (for Gifts/Demands)

Bad-faith behavior:
- If an offer becomes worse for the other side compared to the previous offer, friction increases faster.
- Repeated bad-faith cycles can add a reputation scar.

---

## Deal Valuation

Deal acceptance is based on three components:

### A) Material Value
Base numeric value from a valuation table (era-scaled).

### B) Strategic Need
Multipliers based on:
- active agendas
- current incidents
- war posture
- resource scarcity
- victory trajectory

### C) Credibility Discount
Deferred clauses are discounted based on:
- treaty-break scars
- honor/personality
- current tension

Examples of deferred clauses:
- gold per turn
- access treaties
- pacts
- incident support promises

---

## Breach and Renewal

### Breaking a Deal (Breach)
Any party may breach an active contract.
Effects:
- Large relation penalty
- Influence penalty
- Long-term reputation scar (severity by contract importance)
- May trigger an incident if agenda-linked or tension is high

Breach is never free and must be rare for Legalist personalities.

---

### Continuing a Deal (Renewal)
A deal may be renewed starting **5 turns before expiry**.
Renewal:
- Replaces the ending contract with a fresh 25-turn contract
- Small relation boost
- Small influence boost
- Long-term positive reputation tag (“gold star” / reliable partner)

Renewal is the primary way to build durable alliances without permanent treaties.

---

## Unilateral Actions vs Negotiated Clauses

Some actions may exist as unilateral state actions and/or negotiated clauses.

### Recommended Default
- **Closed Borders** and **Trade Embargo** are unilateral actions.
- Diplomacy may still propose their reversal (Open Borders / Lift Embargo) as clauses.

Unilateral actions interact with the "Leave now" timer rules.

---

## Secret Promises

Secret promises are:
- Non-binding
- Penalized heavily if broken
- Intended for planning and signaling, not guaranteed coordination

### Leaks
If spies are present in relevant scopes, they may attempt to leak a secret promise.
Leak effects:
- Converts secret promise into public knowledge
- Adds relation penalties and tension
- May create a Minor Incident (“betrayal revealed”)

---

## Incident Integration Rules

### What can trigger incidents
- Refusing a Demand
- Refusing certain Gifts (contextual)
- Breaking contracts
- Expulsions / border closures via "Leave now" timers

### Agenda-driven risk surfacing
The UI must always show:
- acceptance probability (for AI)
- consequence preview
  - “refusal will start a Minor Incident”
  - “refusal may escalate to a Major Incident due to agenda X”

---

## Supporters and Third Parties

Only the two principal parties can negotiate the core deal.
Supporters may:
- Send requests to a principal
- Offer side payments as separate deals

This avoids N-party negotiation complexity.

---

## Strategic AI Usage

Strategic AI uses diplomacy to:
- Convert agenda pressure into concessions
- Avoid wars it cannot win
- Build credibility via renewals
- Punish chronic breakers by discounting deferred terms
- Trigger or defuse incidents using demands/gifts

---

## Hard Constraints

- Diplomacy must be explainable via agendas, incidents, and visible presence
- No omniscient valuation (use only known info)
- Breach must always carry significant penalties
- Renewals must be possible and rewarded

---

## Design Intent

This system exists to:
- Make diplomacy a core game loop, not a sidebar
- Tie public intent (agendas) to visible conflict (incidents)
- Make trust and long-term behavior mechanically real

If a diplomatic outcome cannot be explained by these rules, it is a bug.

