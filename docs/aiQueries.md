# AI Strategic Query System

## Purpose
Define **how the AI thinks**, not what it knows.

This document specifies the **query-driven decision architecture** that produces:
- Seemingly human-like behavior
- Predictable performance
- Scalable difficulty
- Clear failure modes (hubris, panic, tunnel vision)

The AI does not globally optimize every turn.
It asks a small number of **recursive questions**, escalating attention only when needed.

---

## Core Principle

> **AI intelligence emerges from when it chooses to care.**

The AI operates in three nested horizons:

1. **Strategic** – epoch / agenda scale
2. **Regional** – incident / theater scale
3. **Local** – city / unit action scale

Each horizon:
- Has its own queries
- Early-exits aggressively
- Escalates problems upward

Information flows **upward**.
Intent flows **downward**.

---

## Strategic Horizon

### Scope
- Whole player
- Epoch-scale outcomes
- Agenda success or failure

### Frequency
- Rare
- Event-driven
- High computational budget

---

### Strategic Query Loop

#### S1. Am I Winning?

**Question**
- Are my active agendas progressing toward success?

**Inputs**
- Agenda progress
- Influence drain vs output
- Incident opposition
- Reputation trajectory
- Crisis pressure

**Outputs**
- `Winning`
- `Stalling`
- `Losing`

Early exit if `Winning`.

---

#### S2. If Not Winning: How Could I Win?

**Question**
- Is there a viable pivot that improves my chance of victory?

**Pivot Classes**
- External escalation (new or escalated agenda)
- External alignment (support others)
- Internal reform (policy, stability)
- Opportunistic exploitation (incidents)

**Output**
- Best viable pivot (or none)

**Difficulty Hook**
- Lower difficulty misjudges second-order effects
- Higher difficulty models coalitions, reputation backlash

---

#### S3. If No Viable Pivot: Prepare Epoch Change

**Question**
- Is collapse now better than slow decay?

**Inputs**
- Crisis proximity
- Influence / faith starvation
- Reputation deadlock

**Outputs**
- Reform
- Loyalist civil war
- Revolutionary civil war

This is a **strategic success path**, not failure.

---

## Regional Horizon

### Scope
- Regions where the player has cities or units
- Incident clusters
- Border theaters

### Frequency
- Periodic
- Triggered by incidents, detection, or flags from Local

---

### Regional Query Loop (per Region)

#### R1. Is This Region Calm?

**Question**
- Is the region trusted, calm, and low-tension?

**Inputs**
- Incident presence
- Tension
- Hostile agent suspicion

**Output**
- `Calm` → Early exit
- `Unstable` → Continue

---

#### R2. Can I Win Here With What I Have?

**Question**
- Can existing units, agents, and influence stabilize or win this region?

**Inputs**
- Local force balance
- Agent presence
- Influence availability

**Outputs**
- `Yes` → Delegate to Local
- `No` → Escalate first, then delegate to Local

Even when a region cannot be won with current resources, Local must still run to:
- execute defensive actions
- preserve units
- reduce losses
- buy time for reinforcements

**Difficulty Hook**
- Lower difficulty overestimates local sufficiency
- Higher difficulty models reinforcements and timing

---

#### R3. Flag Region Needs Help

**Question**
- Should this region request strategic attention?

**Effects**
- Marks region as priority
- Triggers Strategic evaluation next turn

No direct action taken here.

---

## Local Horizon

### Scope
- Cities
- Unit clusters
- Agent missions

### Frequency
- Every turn
- Cheap and bounded

---

### Local Query Loop (per Locality)

#### L1. Do I Have Work to Do?

**Question**
- Are there unresolved local objectives?

**Inputs**
- Nearby enemies
- Active missions
- Unfinished orders

**Output**
- `No` → Early exit
- `Yes` → Continue

---

#### L2. Compute Local Action Pattern

**Question**
- What is the best local action pattern this turn?

**Actions**
- Unit movement and combat
- Agent mission selection
- City-level actions

Search depth is **strictly bounded**.

**Difficulty Hook**
- Lower difficulty uses greedy heuristics
- Higher difficulty recognizes patterns (ZOC, focus fire)

---

#### L3. Am I Doing Better Than Last Turn?

**Question**
- Did my local objective improve compared to last turn?

**Inputs**
- Territory control
- Tension delta
- Objective progress

**Outputs**
- `Improving` → Continue locally
- `Worsening` → Flag region for help

This propagates failure upward.

---

## Escalation and Information Flow

- Local failures flag Regions
- Regional failures trigger Strategic reassessment
- Strategic intent cascades downward as priorities

No horizon directly commands sideways peers.

---

## Difficulty Scaling (Unified)

Difficulty does **not** add cheats or extra systems.

Difficulty controls:
- Accuracy of evaluations
- Horizon depth
- Willingness to commit resources

Examples:
- Easy AI misjudges when it is winning
- Hard AI sees long-term reputation traps

---

## Web Workers (Optional)

Heavy queries may be delegated to browser workers to preserve UI responsiveness.

Recommended worker candidates:
- Strategic S1/S2 evaluations ("Am I winning?" / pivot search)
- Regional R2 forecasting (local sufficiency with reinforcements)

Rules:
- Worker results are treated as **cached estimates**
- Results may be applied on the following turn or when next requested
- The main thread always runs Local queries to avoid freezing behavior

---

## Performance Guarantees

- Early exits dominate runtime
- Most regions and localities do nothing most turns
- Strategic logic runs rarely
- Worker delegation keeps UI responsive during heavy evaluation

---

## Design Intent

This system exists to:
- Produce believable, fallible AI
- Make difficulty feel like intelligence, not bonuses
- Keep computation proportional to player-visible tension

If the AI appears omniscient or hyperactive, this system is being misused.

