# Fact Sheet — Local AI

This document defines the **Local AI layer**: its purpose, inputs, execution scope, outputs, limits, and difficulty behavior.
It contains only factual rules.

---

## 1. Purpose

The Local AI layer exists to:
- Execute concrete actions competently
- Optimize outcomes within a narrow local scope
- Translate focus and posture into immediate behavior

Local AI does not reason about strategy, intent, or long-term goals.
It performs execution only.

---

## 2. Scope

Local AI operates at the level of:
- Individual units
- Individual cities
- Individual agents

Local AI never coordinates across regions and never sets priorities.

---

## 3. Inputs to Local AI

### 3.1 From Regional AI

Local AI receives only **execution constraints**:
- Regional Role
- Regional Focus
- Directional Emphasis
- Domain Weights
- Posture Guidance

These inputs define *what to emphasize* and *what to avoid*.

---

### 3.2 From Local World State

Local AI observes:
- Nearby friendly and hostile units
- Local terrain and movement constraints
- Local Tension and Incidents
- City production state and queues
- Local access and presence rules

Local AI does not observe global state.

---

## 4. Local Execution Domains

Local AI operates in three execution domains.

---

### 4.1 Combat Execution

Responsibilities:
- Target selection
- Action ordering
- Ability usage
- Retreat, hold, or advance decisions

Constraints:
- Must respect posture guidance
- Must obey movement and engagement rules

---

### 4.2 City Operation

Responsibilities:
- Selecting what to build or train next
- Managing production queues
- Switching production when conditions change

Constraints:
- Must respect regional domain weights
- Must respect city capabilities and limits

---

### 4.3 Agent Operation

Responsibilities:
- Selecting legal missions
- Choosing targets within allowed scope
- Deciding when to stay, withdraw, or relocate

Constraints:
- Must respect access and presence rules
- Must respect regional posture

---

## 5. Outputs

Local AI outputs **concrete actions**:
- Unit orders
- City production choices
- Agent mission assignments

All outputs must be legal and executable immediately.

---

## 6. Upward Feedback

Local AI does not emit explicit reports.

Effects propagate upward indirectly via:
- Units lost or repositioned
- Cities captured, damaged, or stabilized
- Production completed or stalled
- Tension changes
- Access gained or lost

Regional AI interprets these outcomes.

---

## 7. Limits and Non-Responsibilities

Local AI must not:
- Declare agendas
- Initiate incidents
- Change regional roles or focus
- Access strategic plans or priorities
- Access hidden or global information

Local AI never questions intent.

---

## 8. Difficulty Behavior

Local AI difficulty affects **execution quality only**.

On lower difficulty:
- Actions are chosen greedily or sequentially
- Target selection is suboptimal
- Ability timing is inefficient
- Overkill and wasted actions occur

On higher difficulty:
- Actions are sequenced for maximal effect
- Targets are chosen to minimize losses
- Abilities are timed optimally
- Retreats and focus fire are used effectively

Difficulty does not:
- Change available actions
- Change legality rules
- Change strategic intent

---

## 9. Explainability

Local AI behavior must be explainable via:
- Received posture and focus
- Local visible state
- Difficulty-based execution quality

If an action cannot be explained by these inputs, it is invalid.

---

## 10. Invariants

- Local AI executes; it does not decide intent.
- All actions respect higher-layer constraints.
- Difficulty affects skill, not knowledge.

If Local AI behaves strategically, it is mis-scoped.
