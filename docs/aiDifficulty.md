# AI Strategic Difficulty Profiles

## Purpose
Define how **difficulty changes AI behavior** without adding cheats or new systems.

Difficulty is expressed as **parameter tuning** of the same strategic logic:
- Evaluation accuracy
- Lookahead depth
- Risk tolerance
- Memory persistence
- Willingness to collapse/reset

No rules change by difficulty.
No hidden bonuses.

---

## Core Difficulty Knobs

Each difficulty profile sets values for the following knobs.

### 1) Evaluation Accuracy
How often the AI correctly evaluates outcomes of queries such as:
- "Am I winning?"
- "Can I win this region?"

Lower accuracy causes:
- Overconfidence
- Late pivots
- Missed coalition risk

---

### 2) Lookahead Depth
How far ahead the AI simulates consequences.

Applies to:
- Strategic pivot evaluation
- Regional sufficiency checks
- Local tactical patterns

---

### 3) Risk Tolerance
How willing the AI is to:
- Burn influence
- Take reputation damage
- Escalate incidents

Higher tolerance leads to:
- Bolder play
- More dramatic failures

---

### 4) Memory Persistence
How long the AI remembers:
- Failed regions
- Recent losses
- Broken promises (beyond reputation system)

Low persistence causes:
- Repeated mistakes
- Short attention span

---

### 5) Collapse Willingness
How early the AI prefers:
- Reform
- Civil war
- Revolutionary reset

Higher willingness leads to:
- Fewer death spirals
- More dramatic comebacks

---

## Difficulty Profiles

### Easy

- Evaluation Accuracy: **Low**
- Lookahead Depth: **Shallow**
- Risk Tolerance: **High (reckless)**
- Memory Persistence: **Low**
- Collapse Willingness: **Late**

Behavioral Summary:
- Overestimates success
- Commits to losing incidents
- Escalates wars it cannot win
- Rarely collapses until forced

---

### Normal

- Evaluation Accuracy: **Medium**
- Lookahead Depth: **Moderate**
- Risk Tolerance: **Balanced**
- Memory Persistence: **Medium**
- Collapse Willingness: **Situational**

Behavioral Summary:
- Makes understandable mistakes
- Misses some second-order effects
- Occasionally panics or hesitates

---

### Hard

- Evaluation Accuracy: **High**
- Lookahead Depth: **Deep (bounded)**
- Risk Tolerance: **Low**
- Memory Persistence: **High**
- Collapse Willingness: **Early if optimal**

Behavioral Summary:
- Avoids unwinnable wars
- Builds coalitions effectively
- Uses collapse/reset strategically

---

### Brutal

- Evaluation Accuracy: **Very High**
- Lookahead Depth: **Deep + pattern-aware**
- Risk Tolerance: **Very Low**
- Memory Persistence: **Very High**
- Collapse Willingness: **Proactive**

Behavioral Summary:
- Rarely overcommits
- Exploits timing windows
- Resets before decline becomes visible

---

## Application Rules

- Difficulty modifies **query evaluation**, not available actions.
- Local actions always run; difficulty only changes their quality.
- Strategic mis-evaluations are intentional and visible.

---

## Design Intent

This system exists to:
- Make difficulty feel like intelligence
- Preserve fairness and transparency
- Avoid AI bonuses that break immersion

If difficulty changes outcomes without changing decisions, it is a bug.

