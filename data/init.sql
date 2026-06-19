-- FactoryFlow AI — initial schema
-- Run against a fresh database: psql -d factoryflow -f init.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE manuals (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    source_filename VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE machines (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    machine_type    VARCHAR(100),
    manual_doc_id   INTEGER REFERENCES manuals(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE manual_chunks (
    id              SERIAL PRIMARY KEY,
    manual_id       INTEGER REFERENCES manuals(id) ON DELETE CASCADE,
    section_title   VARCHAR(255),
    content         TEXT NOT NULL,
    alarm_codes     TEXT[],
    embedding       VECTOR(1536),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_manual_chunks_alarm_codes ON manual_chunks USING GIN (alarm_codes);

CREATE TABLE incidents (
    id                          SERIAL PRIMARY KEY,
    machine_id                  INTEGER REFERENCES machines(id),
    alarm_code                  VARCHAR(50),
    operator_input              TEXT NOT NULL,
    shift                       VARCHAR(20),
    probable_cause              TEXT,
    recommended_fix             TEXT,
    confidence_score            FLOAT,
    estimated_downtime_minutes  INTEGER,
    resolution_status           VARCHAR(30) DEFAULT 'open',
    created_at                  TIMESTAMPTZ DEFAULT now(),
    resolved_at                 TIMESTAMPTZ
);

CREATE INDEX idx_incidents_alarm_code ON incidents (alarm_code);
CREATE INDEX idx_incidents_machine_id ON incidents (machine_id);

CREATE TABLE resolved_knowledge (
    id                  SERIAL PRIMARY KEY,
    alarm_code          VARCHAR(50) NOT NULL,
    machine_type        VARCHAR(100),
    source_incident_id  INTEGER REFERENCES incidents(id),
    distilled_cause     TEXT NOT NULL,
    distilled_fix       TEXT NOT NULL,
    times_reused        INTEGER DEFAULT 0,
    last_used_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resolved_knowledge_alarm_code ON resolved_knowledge (alarm_code);

CREATE TABLE maintenance_reports (
    id                SERIAL PRIMARY KEY,
    incident_id       INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
    issue_summary     TEXT,
    root_cause        TEXT,
    resolution_steps  TEXT,
    parts_replaced    TEXT,
    downtime_minutes  INTEGER,
    recommendations   TEXT,
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shift_handoffs (
    id                    SERIAL PRIMARY KEY,
    incident_id           INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
    machine_status        TEXT,
    actions_taken         TEXT,
    pending_work          TEXT,
    recommendations_next  TEXT,
    created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_reasoning_steps (
    id              SERIAL PRIMARY KEY,
    incident_id     INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
    step_order      INTEGER NOT NULL,
    node_name       VARCHAR(100) NOT NULL,
    tool_called     VARCHAR(100),
    input_summary   TEXT,
    output_summary  TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reasoning_steps_incident ON agent_reasoning_steps (incident_id, step_order);
