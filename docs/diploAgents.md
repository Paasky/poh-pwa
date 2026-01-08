# AI Strategic Agent Capacity

## Purpose
Define how **Diplomats**, **Spies**, and **Missionaries** are produced, capped, maintained, and removed.
This specification ensures:
- Predictable scaling across eras
- Hard limits that prevent spam
- Clear tradeoffs against influence/faith economies
- Consistent integration with agendas, incidents, diplomacy, and reputation

---

## Agent Types

### Diplomat
- Public, city-anchored political presence
- Enables binding diplomacy and public incident actions
- Primary role: stabilize/formalize, negotiate, de-escalate

### Spy
- Hidden, city-anchored covert presence
- Primary role: information, pressure, acceleration
- Creates city suspicion; countered by sweeps

### Missionary
- Public, city-anchored ideological presence
- Primary role: religious pressure (and stabilization when aligned)
- Denial/removal can create incidents

---

## Capacity Source: Influence Buildings

### Influence Buildings
- Each city may construct up to the city’s cap of **Influence Building** types (design-controlled; typically 1 type per city cap).
- Each Influence Building provides **Agent Slots**.

### Agent Slots
- Each used agent (Diplomat / Spy / Missionary) consumes **1 agent slot**.
- Slot count per influence building grows linearly through the tech tree:
  - Early game: 1–2 slots
  - Mid game: 3–6 slots
  - Late game: 7–10 slots

Slots are the primary hard cap. Upkeep is the primary soft cap.

---

## Assignment Scope

Agents are assigned to a **city**.

### Effects Scope
- Effects apply to the assigned city and the city’s relevant incident/agenda scope.
- No empire-wide agent effects.

---

## Upkeep and Currency

### Diplomats
- Upkeep currency: **Influence** (per turn)

### Spies
- Upkeep currency: **Influence** (per turn)

### Missionaries
- Upkeep currency: **Faith** (per turn)

Missionaries follow the same upkeep/starvation pattern as other agents; only the currency differs.

---

## Starvation Rules

## Influence Starvation (Diplomats, Spies)

### Rule
If influence output cannot support ongoing drains (agendas + agent upkeep + incident commitments), the player enters **influence starvation**.

### Resolution
- The system automatically cancels agendas as required (per agenda rules).
- Any remaining shortfall disbands influence-upkeep agents in priority order.

### Disband Priority (recommended)
1. Spies (highest maintenance volatility)
2. Diplomats

---

## Faith Starvation (Missionaries)

### Rule
If faith output cannot support ongoing drains (missionary upkeep + other faith sinks), the player enters **faith starvation**.

### Resolution
- Missionaries are disbanded in priority order (recommended: newest first) until faith starvation ends.
- Disband uses the same pattern as influence starvation (deterministic, no negative stockpiles).

---

## Currency Sinks

### Influence sinks
- Agendas
- Incidents
- Diplomat upkeep
- Spy upkeep

### Faith sinks
- Missionary upkeep
- New myths / gods / dogmas (religion bonus growth)

---

## Influence Starvation and Auto-Disband

### Rule
If influence output cannot support ongoing drains (agendas + agent upkeep + incident commitments), the player enters **influence starvation**.

### Resolution
- The system automatically cancels agendas as required (per agenda rules).
- Any remaining shortfall disbands influence-upkeep agents in priority order.

### Disband Priority (recommended)
1. Spies (highest maintenance volatility)
2. Diplomats

Missionaries are not disbanded by influence starvation (they are faith-driven), but may still be removed by access rules.

---

## Faith Starvation for Missionaries

If faith is insufficient to sustain missionaries:
- Missionaries become inactive immediately (stop effects)
- Missionaries are removed after a short grace period (configurable; recommended 1–3 turns)

This prevents negative stockpiles and preserves deterministic outcomes.

---

## Presence Requirements (Binding)

### Diplomats
A diplomat must be present in the relevant city scope to:
- Propose binding treaties
- Issue demands that can trigger incidents
- Join/escalate incidents publicly
- Sign or renew contracts

### Missionaries
- Require access to enter (see Borders & Removal Timers)
- Can create Minor Incidents via entry denial

### Spies
- Require city presence to run missions
- Create city suspicion; cannot be countered globally

---

## Borders, Access, and Removal Timers ("Leave now")

Diplomats, missionaries, and military units obey timed removal when access changes.

### Trigger
- Borders closed
- Access revoked
- Treaty expiry without renewal

### Rule
- Affected pieces receive a grace period to leave.
- Failure to leave by the deadline:
  - Raises tension
  - May create or escalate an incident

This prevents teleportation and creates legible escalation.

---

## Entry / Removal Rules by Agent

### Diplomats
- Entry requires access (open borders / equivalent)
- Removal methods:
  - Borders closed (timed removal)
  - Persona non grata (policy/diplomacy action; relation hit)

### Missionaries
- Entry requires access (except vassal rules)
- Effects:
  - Raise tension when acting against city owner’s state religion
  - Lower tension when acting toward city owner’s state religion
- Removal methods:
  - Borders closed (timed removal)
  - Religious suppression policies (if applicable)

### Spies
- Entry is covert
- Removal methods:
  - Counter-espionage sweeps (city-scoped)
  - Quiet expulsion or public accusation after detection

---

## Vassal and Confederation Rules

### Vassals
- Missionaries may operate freely in vassal territory without needing consent.
- Overlords may act on vassal incidents/agendas without diplomats.

### Confederation Policy
- Internal affairs handled per state/vassal
- Foreign affairs handled by overlord
- Diplomatic presence may be centralized at the overlord level

---

## Multiple Agents in One City

### Diplomats
- Multiple diplomats allowed.
- Additional diplomats increase:
  - negotiation strength
  - de-escalation effectiveness
- Diminishing returns recommended after 2.

### Spies
- Multiple spies allowed.
- Additional spies increase:
  - success probability
  - resilience (work continues if one is removed)
- Additional spies do not suppress suspicion.

### Missionaries
- Multiple missionaries allowed.
- Coexistence rules are religion-policy-dependent.
- Recommended default:
  - Multiple religions can be present
  - Pressure/tension outcomes depend on state religion alignment

---

## Scaling Guidelines

Agent capacity should scale predictably and slowly.

Recommended pacing:
- Early game: 0–2 agents total per player
- Mid game: 2–6 agents total per player
- Late game: 6–15 agents total per player (large empires)

This scaling emerges naturally if:
- Agent slots are tied to influence buildings
- Influence and faith upkeep remain meaningful

---

## AI Allocation Heuristics (non-binding guidance)

AI should allocate agents by ranked priorities:

### Diplomats
1. Incident-scoped cities
2. Agenda-target cities
3. Border capitals / chokepoints

### Spies
1. High tension or suspicious cities
2. Incident deadlocks
3. Agenda-critical cities (resource/holy city/capital)

### Missionaries
1. Cities where alignment lowers tension (stabilize allies/vassals)
2. Cities where misalignment pressures (targets)
3. Holy city networks (if visibility bonuses exist)

---

## Hard Constraints

- All agents require city-level presence
- All agents consume exactly 1 agent slot
- Influence/faith cannot go negative
- Access removal uses timed leaving (no teleport)

---

## Design Intent

This system exists to:
- Make diplomacy and espionage physically grounded
- Prevent global omnipresence and spam
- Tie strategic reach to real economic investment
- Enable clear counterplay and readable AI behavior

If an agent can act without presence, cost, or counterplay, it is a bug.

