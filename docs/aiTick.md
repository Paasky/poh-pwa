# AI Strategic Tick Checklist

> Purpose: Define the exact **per-turn evaluation order** for the Strategic AI.  
> Audience: Engine / gameplay programmers.  
> Scope: One strategic tick (normally once per turn per player).

This checklist is **deterministic**. Steps must be executed in order.  
Early exits are allowed only where explicitly stated.

---

## 0. Preconditions

Before running the Strategic AI tick:

- World state is stable
- All yields for the turn are finalized
- Fog of war is applied
- No unit-level or regional actions are pending

If any precondition fails, abort the tick.

---

## 1. Update Strategic Context Snapshot

Capture a read-only snapshot of:

- Known borders and neighbors
- Known military presence near borders
- Known treaties, agendas, incidents
- Influence income and drain
- Internal stability indicators

This snapshot is immutable for the duration of the tick.

---

## 2. Personality Filter

Apply personality modifiers:

- Risk tolerance
- Escalation bias
- Honor / promise weight
- Ideological rigidity

This produces:

- Escalation thresholds
- Back-down tolerance
- Agenda aggression bias

No decisions are made here. Only weights are derived.

---

## 3. Hard Constraint Check

If any of the following are true:

- Influence <= 0
- Forced agenda cancellation required
- Mandatory cooldown active

Then:

- Resolve forced cancellations
- Skip agenda creation
- Proceed to Step 6

---

## 4. Active Agenda Evaluation

For each active agenda:

- Check progress vs predefined success conditions
- Estimate remaining time vs remaining influence
- Estimate opposition strength

Classify agenda state:

- On track
- At risk
- Failing

No cancellation occurs here.

---

## 5. Agenda Resolution Decision

For agendas classified as *At risk* or *Failing*:

Strategic AI may choose one:

- Continue
- Escalate (if allowed)
- Accept failure

Decision must consider:

- Personality
- Reputation impact
- Cooldown consequences
- Collapse risk

If escalation chosen, lock agenda for this turn.

---

## 6. Incident Evaluation

For each relevant incident:

- Check escalation stage
- Check influence already wagered
- Check third-party supporters

Decide:

- Back down
- Match escalation
- Escalate

Backing down must apply reputation scars immediately.

---

## 7. War Evaluation

If involved in war:

- Recalculate war score trend
- Recalculate war weariness trend
- Re-evaluate war goals

Decide:

- Continue war
- Seek peace
- Accept unfavorable peace

No tactical combat decisions occur here.

---

## 8. Treaty Evaluation

For each treaty:

- Check benefit vs current trajectory
- Check ideological consistency
- Check honor / promise weight

Possible actions:

- Maintain
- Renegotiate
- Break (apply penalties)

Breaking treaties must be rare and personality-justified.

---

## 9. Collapse & Vassalage Check

Evaluate:

- Internal unrest trajectory
- Influence sustainability
- Military overextension

If collapse probability exceeds threshold:

- Consider voluntary vassalage
- Consider intentional failure of agendas

Collapse is a valid strategic outcome.

---

## 10. Victory Trajectory Evaluation

Re-evaluate:

- Primary victory path
- Fallback victory path

Check:

- Is current path still achievable?
- Has another path become dominant?

Switching paths is allowed only if:

- Cooldowns permit
- Influence budget allows

---

## 11. New Agenda Consideration

If agenda slots available and no blocking cooldown:

- Generate candidate agendas
- Score by:
    - Personality fit
    - Victory alignment
    - Risk profile

Select **at most one** new agenda.

---

## 12. Strategic Output Generation

Emit high-level directives to Regional AI:

- Priority regions
- Desired posture (defensive / aggressive)
- Resource focus hints

No map-specific instructions are allowed.

---

## 13. Logging & Explainability

Log:

- All agenda decisions
- All escalations and back-downs
- All treaty changes
- Victory path changes

Each log entry must be explainable in human terms.

---

## 14. Postconditions

After tick completion:

- Strategic intent is stable until next turn
- No retroactive changes allowed
- All costs are accounted for

If postconditions fail, the tick is invalid.

---

## Debug Invariant

At any point, a developer must be able to answer:

> "Why did the AI do this?"

Using only:

- Current state
- Personality
- This checklist

If not, the behavior is incorrect.
