# Fact Sheet — AI Queries

This document defines **AI queries**: how the AI gathers the information it needs to make decisions without scanning the entire world every tick.
It contains only factual rules.

---

## 1. Purpose

AI queries exist to:
- Keep AI computation predictable and bounded
- Make AI reasoning legible and explainable
- Ensure AI reads only what a player could know

AI queries never grant hidden information.

---

## 2. What a Query Is

- A query is a targeted read of game state relevant to a decision.
- A query returns a limited set of results.
- Queries are executed during the AI tick and feed Plans and Priorities.

---

## 3. Visibility Rules

- All query results respect:
  - fog-of-war
  - diplomatic visibility
  - public vs private treaty knowledge
  - detected vs undetected espionage

If the player cannot know it, the query cannot return it.

---

## 4. Query Scopes

Queries are organized by scope:

- **Self scope** (own empire state)
- **Local scope** (cities, borders, incidents the AI is involved in)
- **Neighborhood scope** (nearby rivals, nearby military)
- **World scope** (public global facts)

The AI does not scan world scope by default.

---

## 5. Query Categories (Canonical)

### 5.1 Tension and Incidents

Queries identify:
- highest-tension cities in relevant scopes
- active incidents involving self, allies, or neighbors
- incident escalation level and clock position

---

### 5.2 Relations

Queries gather the inputs needed to compute the four Relations facets:
- Alignment inputs
- Trust inputs
- Pressure inputs
- Military power inputs

---

### 5.3 Economy (Diplomacy-Relevant)

Queries identify:
- current Influence and Faith output
- current storage
- projected shortage risks under current drains

---

### 5.4 Resources and Strategic Needs

Queries identify:
- critical resource shortages
- which neighbors possess needed resources
- feasible routes to obtain them:
  - trade
  - vassalization
  - conquest

Feasibility is evaluated using observable Relations and presence rules.

---

### 5.5 Military Situation

Queries identify:
- own total strength
- enemy total strength (only what is observable)
- nearby hostile military presence near borders and incident scopes

---

### 5.6 Access and Presence

Queries identify:
- where diplomats are present (capital and local)
- where agents are present
- current access status and removal timers

---

## 6. Query Limits

- Each tick has a fixed query budget.
- Queries return only the top results needed for decision-making.

Examples:
- top N high-tension cities
- top N nearest hostile forces
- top N most important incidents

---

## 7. Priority-Driven Querying

- Queries are driven by current Plans and Priorities.
- If the AI is preparing for conflict with a neighbor, queries focus on:
  - that neighbor’s borders
  - relevant cities
  - relevant incidents
  - nearby military

The AI does not waste budget querying unrelated areas.

---

## 8. Difficulty Interaction

Difficulty changes:
- how many queries are executed
- how many results each query returns
- how far the AI looks beyond immediate scopes

Difficulty does not change visibility rules.

---

## 9. Explainability

- Every significant AI action can point back to:
  - the query results that mattered
  - the Plan that was formed
  - the Priority that was selected

Players may not see the internal plan, but they can see the observed causes.

---

## 10. Invariants

- Queries never bypass fog-of-war or diplomacy visibility.
- Query budget is fixed and enforced.
- Queries are driven by relevance.

If a decision depends on information a query could not legally return, it is invalid.

