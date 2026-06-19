# Database Schema

PostgreSQL is the single source of truth for everything the agent has
learned. Spring Boot owns writes/reads to this schema; the LangGraph
service never talks to Postgres directly — it receives context from
Spring Boot and returns structured results that Spring Boot persists.
This keeps transactional integrity in one place.

## Why this schema shape, not a generic one

The brief's core differentiator is "knowledge compounds over time." That
only becomes real if `resolved_knowledge` is a first-class table the
agent's "search similar incidents" tool actually queries — not just an
incidents log nobody reads back. Every table here exists because a
specific tool or demo moment needs it.

## Tables

### `machines`

Static reference data. Lets the demo reference "Machine B" instead of a
raw ID, and gives the agent something to scope incident search by.

```sql
CREATE TABLE machines (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,        -- "Packaging Line B"
    machine_type    VARCHAR(100),                  -- "Press Machine"
    manual_doc_id    INTEGER REFERENCES manuals(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### `manuals`

One row per ingested manual. The actual searchable content lives in
`manual_chunks` (for RAG retrieval) — this table is metadata.

```sql
CREATE TABLE manuals (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    source_filename  VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### `manual_chunks`

Chunked manual text with embeddings, for retrieval. Each chunk knows
which alarm/error codes it covers, so the "Retrieve Manual" tool can
do a fast exact-match lookup before falling back to vector search —
this matters because exact alarm-code lookup should be instant and
deterministic, not dependent on embedding similarity alone.

```sql
CREATE TABLE manual_chunks (
    id              SERIAL PRIMARY KEY,
    manual_id       INTEGER REFERENCES manuals(id),
    section_title   VARCHAR(255),
    content         TEXT NOT NULL,
    alarm_codes     TEXT[],              -- e.g. {'E217', 'E218'} for fast lookup
    embedding       VECTOR(1536),        -- pgvector; adjust dim to chosen embedding model
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_manual_chunks_alarm_codes ON manual_chunks USING GIN (alarm_codes);
```

Requires the `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`

### `incidents`

Every agent run that resolves (or attempts to resolve) a machine issue.
This is the raw event log — `resolved_knowledge` below is the distilled,
reusable version of a subset of these.

```sql
CREATE TABLE incidents (
    id                  SERIAL PRIMARY KEY,
    machine_id          INTEGER REFERENCES machines(id),
    alarm_code          VARCHAR(50),
    operator_input      TEXT NOT NULL,
    shift               VARCHAR(20),            -- 'night', 'morning', 'day'
    probable_cause       TEXT,
    recommended_fix      TEXT,
    confidence_score     FLOAT,                   -- drives the branch: low confidence -> search more
    estimated_downtime_minutes INTEGER,
    resolution_status    VARCHAR(30) DEFAULT 'open',  -- open, resolved, escalated
    created_at          TIMESTAMPTZ DEFAULT now(),
    resolved_at         TIMESTAMPTZ
);

CREATE INDEX idx_incidents_alarm_code ON incidents (alarm_code);
CREATE INDEX idx_incidents_machine_id ON incidents (machine_id);
```

### `resolved_knowledge`

This is the table that makes "tribal knowledge preserved" literal
instead of a slide claim. When an incident resolves successfully, its
distilled fix gets written here, keyed by alarm code + machine type, so
future lookups are direct and fast rather than re-deriving from raw
incident text every time. The "search similar incidents" tool queries
this table first.

```sql
CREATE TABLE resolved_knowledge (
    id                  SERIAL PRIMARY KEY,
    alarm_code          VARCHAR(50) NOT NULL,
    machine_type        VARCHAR(100),
    source_incident_id   INTEGER REFERENCES incidents(id),
    distilled_cause      TEXT NOT NULL,
    distilled_fix        TEXT NOT NULL,
    times_reused         INTEGER DEFAULT 0,      -- increment each time this entry resolves a new incident
    last_used_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resolved_knowledge_alarm_code ON resolved_knowledge (alarm_code);
```

`times_reused` is what lets you show, live in the demo, that the second
time E217 fires the agent says "this fix has resolved this alarm 4
times before" — that single line is doing a lot of demo work.

### `maintenance_reports`

Generated report per incident. Stored as structured fields, not a
single text blob, so the frontend can render it cleanly rather than
dumping raw LLM output.

```sql
CREATE TABLE maintenance_reports (
    id                  SERIAL PRIMARY KEY,
    incident_id          INTEGER REFERENCES incidents(id),
    issue_summary        TEXT,
    root_cause           TEXT,
    resolution_steps      TEXT,
    parts_replaced        TEXT,
    downtime_minutes      INTEGER,
    recommendations       TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);
```

### `shift_handoffs`

Generated handoff note per incident (or per shift, if you extend later
to batch multiple incidents into one handoff).

```sql
CREATE TABLE shift_handoffs (
    id                  SERIAL PRIMARY KEY,
    incident_id          INTEGER REFERENCES incidents(id),
    machine_status        TEXT,
    actions_taken         TEXT,
    pending_work          TEXT,
    recommendations_next  TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);
```

### `agent_reasoning_steps`

This table is what powers the "visible reasoning" demo feature — each
node the LangGraph agent passes through gets logged here in order, so
the frontend can either replay it for a polished demo or stream it live
during the actual run.

```sql
CREATE TABLE agent_reasoning_steps (
    id              SERIAL PRIMARY KEY,
    incident_id      INTEGER REFERENCES incidents(id),
    step_order       INTEGER NOT NULL,
    node_name        VARCHAR(100) NOT NULL,    -- e.g. 'retrieve_manual', 'search_incidents', 'branch_confidence'
    tool_called      VARCHAR(100),
    input_summary    TEXT,
    output_summary   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reasoning_steps_incident ON agent_reasoning_steps (incident_id, step_order);
```

## Entity relationship summary

```
machines ──< incidents >── manuals ──< manual_chunks
                │
                ├──< maintenance_reports
                ├──< shift_handoffs
                ├──< agent_reasoning_steps
                │
                └──> resolved_knowledge (via source_incident_id)
```

## Seed data needed before demo

- 1 machine ("Packaging Line B", type "Press Machine")
- 1 manual ingested and chunked, covering at least alarm codes E217,
  E218, E305 with real troubleshooting tree structure
- 8–12 historical incidents across both shifts, some terse some
  detailed (realistic variance in how operators actually log things)
- 2–3 pre-existing `resolved_knowledge` entries with `times_reused` > 0,
  so the very first demo query already shows compounding knowledge,
  not just the one you create live
