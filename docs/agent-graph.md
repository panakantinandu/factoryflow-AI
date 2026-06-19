# Agent Graph Design (LangGraph)

This is the part judges actually evaluate as "is this an agent or a
chatbot." A linear chain (retrieve → generate → done) is what most
teams will ship under time pressure. The branching logic below is what
makes this defensibly different — and it's not extra complexity for its
own sake, every branch maps to a real operational decision a human
technician would make.

## Graph overview

```
                         ┌─────────────────┐
                         │   START          │
                         │  (operator input)│
                         └────────┬─────────┘
                                  ▼
                         ┌─────────────────┐
                         │ parse_alarm       │
                         │ (extract code,    │
                         │  machine, context) │
                         └────────┬─────────┘
                                  ▼
                         ┌─────────────────┐
                         │ search_known      │
                         │ (resolved_         │
                         │  knowledge lookup) │
                         └────────┬─────────┘
                                  ▼
                         ┌─────────────────┐
                    ┌────│ branch: found      │
                    │    │ high-confidence    │
                    │    │ prior fix?         │
                    │    └────────┬─────────┘
                    │ YES                  │ NO
                    ▼                      ▼
         ┌─────────────────┐     ┌─────────────────┐
         │ use_known_fix     │     │ retrieve_manual   │
         │ (skip deep search,│     │ + search_incidents │
         │  fast path)       │     │ (parallel)         │
         └────────┬─────────┘     └────────┬─────────┘
                    │                       ▼
                    │              ┌─────────────────┐
                    │              │ branch: confidence │
                    │              │ in diagnosis?      │
                    │              └────────┬─────────┘
                    │              HIGH              LOW
                    │                │                 ▼
                    │                │        ┌─────────────────┐
                    │                │        │ web_search        │
                    │                │        │ (Tavily)           │
                    │                │        └────────┬─────────┘
                    │                │                 │
                    │                ▼                 ▼
                    │       ┌─────────────────────────────┐
                    └──────>│ generate_diagnosis             │
                            └────────────────┬────────────┘
                                              ▼
                                   ┌─────────────────┐
                                   │ generate_report    │
                                   └────────┬─────────┘
                                              ▼
                                   ┌─────────────────┐
                                   │ generate_handoff   │
                                   └────────┬─────────┘
                                              ▼
                                   ┌─────────────────┐
                                   │ persist_knowledge  │
                                   │ (write/update       │
                                   │  resolved_knowledge)│
                                   └────────┬─────────┘
                                              ▼
                                          ┌───────┐
                                          │  END   │
                                          └───────┘
```

## Why each branch exists (the part that matters for the pitch)

**Branch 1 — known fix found vs. not found.** This is the literal
implementation of "tribal knowledge preserved." If `resolved_knowledge`
already has a high-confidence entry for this alarm code on this
machine type, the agent should not waste time re-deriving the answer
from scratch — it should say so explicitly ("this fix has resolved this
alarm 4 times before") and move straight to confirming + generating
docs. This is the fast path that makes the second demo run visibly
quicker than the first.

**Branch 2 — diagnosis confidence high vs. low.** A real technician
doesn't always know the answer after checking the manual once — if the
manual section is ambiguous or no similar incidents are found, they'd
go look something up externally before guessing. The agent should do
the same: only call Tavily web search when manual + incident search
didn't produce a confident answer. This branch is also a believable use
of the Tavily sponsor tool — not bolted on, but triggered by genuine
uncertainty.

## Nodes — what each one does

### `parse_alarm`
Extracts structured fields from free-text operator input: alarm code,
machine reference, any context already given. Single Featherless AI
call with a tight extraction prompt, not free generation.

### `search_known`
Direct query against `resolved_knowledge` filtered by alarm_code +
machine_type. No LLM call needed here — this is a database lookup. If
a match exists with `times_reused >= 1`, treat as high confidence.

### `use_known_fix`
Formats the existing `resolved_knowledge` entry into the diagnosis
output shape, increments `times_reused`, updates `last_used_at`.

### `retrieve_manual`
Two-stage lookup: exact match against `manual_chunks.alarm_codes` array
first (fast, deterministic), fall back to vector similarity search via
pgvector if no exact match. This tool should be built first and built
well — it's one of the two "deep" tools.

### `search_incidents`
Queries `incidents` table for prior occurrences of this alarm_code on
this or similar machine_type, returns frequency and prior
probable_cause/recommended_fix values. The second "deep" tool.

### `branch_confidence`
Not a tool call — a conditional edge function. Confidence is derived
from: did manual retrieval return an exact alarm-code match (high
signal) + did incident search return 2+ prior occurrences with
consistent resolution (high signal). If both weak, route to web_search.

### `web_search`
Tavily call scoped to manufacturer documentation / technical references
for the specific machine type + alarm code. Only reached on the low-
confidence branch — this matters for the pitch, since it shows the
agent reasoning about when external search is actually needed.

### `generate_diagnosis`
Single Featherless AI call synthesizing whichever inputs were gathered
(known fix, or manual + incidents + optionally web search) into:
probable cause, recommended fix, confidence score, estimated downtime.

### `generate_report`
Featherless AI call with a carefully engineered prompt producing the
structured maintenance report fields (issue summary, root cause,
resolution steps, parts replaced, downtime, recommendations). This
prompt deserves real iteration time — it's a moment non-technical
judges will read closely.

### `generate_handoff`
Featherless AI call producing the shift handoff note: machine status,
actions taken, pending work, recommendations for next shift. Should
read like something a foreman actually writes, not generic LLM prose —
worth giving this its own few-shot examples in the prompt.

### `persist_knowledge`
If `resolution_status` ends as 'resolved' and confidence was high,
upsert into `resolved_knowledge` (insert new, or increment
`times_reused` on existing). This is the step that makes the loop
actually close.

## State object (passed between nodes)

```python
class AgentState(TypedDict):
    operator_input: str
    alarm_code: str | None
    machine_id: int | None
    shift: str | None
    known_fix: dict | None          # populated if search_known hits
    manual_result: dict | None
    incident_results: list[dict]
    web_search_result: dict | None
    confidence_score: float
    diagnosis: dict | None
    report: dict | None
    handoff: dict | None
    reasoning_log: list[dict]        # appended to at every node, written to agent_reasoning_steps
```

`reasoning_log` is what feeds the live-streaming UI feature — every
node appends a `{node_name, input_summary, output_summary}` entry
before passing state forward, and the API streams these as they happen
rather than waiting for the full graph to finish.

## Build order within this graph (do this first, in this order)

1. `parse_alarm` + `search_known` + `use_known_fix` — get the fast path
   working end-to-end first, since it's the simplest complete loop and
   proves the architecture.
2. `retrieve_manual` — the first "deep" tool, build it well.
3. `search_incidents` — the second "deep" tool.
4. `branch_confidence` + `generate_diagnosis` — wire the slow path.
5. `web_search` (Tavily) — only after the above works without it.
6. `generate_report` + `generate_handoff` — these are prompt-engineering
   heavy, budget real time here, not an afterthought at hour 15.
7. `persist_knowledge` — closes the loop, makes the second-run demo work.

This order matters because steps 1–4 alone are already a demoable,
branching agent — everything after is enrichment, not a blocker to
having something working.
