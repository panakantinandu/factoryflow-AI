# FactoryFlow AI Agent

AI-powered manufacturing operations copilot. Diagnoses machine issues,
retrieves institutional knowledge, generates maintenance documentation,
and preserves tribal knowledge — through autonomous reasoning and tool
execution, not a chatbot wrapper.

Built for Buildathon Dallas, June 18–19, 2026.

## The problem (why this exists)

Manufacturing operators lose 20–60 minutes per incident searching PDF
manuals, repeat the same troubleshooting across shifts because prior
fixes aren't accessible, manually write maintenance reports every time,
and lose tribal knowledge entirely when experienced technicians leave.

## What this is NOT

- Not a chatbot wrapper around an LLM
- Not a dashboard / KPI viewer
- Not a PDF Q&A bot with no memory
- Not a single linear LLM call pretending to be an "agent"

## What this IS

An agent with a real reasoning graph: branching logic, multi-step tool
calls, and a state that compounds over time. Resolving the same alarm
twice should visibly take less effort the second time, because the
agent found its own prior resolution.

```
Operator Input
     ↓
Agent Reasoning (LangGraph)
     ↓
Tool Calls (manual lookup, incident search, web search)
     ↓
Branch: confidence high? → diagnosis
        confidence low?  → search more / ask clarifying question
     ↓
Outcome: diagnosis + maintenance report + shift handoff note
     ↓
Knowledge stored for next time
```

## Architecture

Two backend services, intentionally polyglot — Java owns transactional
integrity and the API surface, Python owns AI orchestration. This is a
deliberate choice, not a compromise: LangGraph has no mature Java
equivalent, and splitting responsibilities this way is a stronger
engineering story than forcing everything into one language.

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   React      │ ───> │   Spring Boot     │ ───> │  LangGraph Service   │
│   Frontend   │      │   (Java, :8080)   │ HTTP │  (Python, :8000)     │
│              │ <─── │                   │ <─── │                      │
└─────────────┘      └──────────────────┘      └─────────────────────┘
                             │                            │
                             ▼                            ▼
                      ┌─────────────┐            ┌─────────────────┐
                      │ PostgreSQL   │            │ Featherless AI   │
                      │ (incidents,  │            │ (LLM reasoning)  │
                      │  reports,    │            │                  │
                      │  handoffs)   │            │ Tavily           │
                      └─────────────┘            │ (web search)     │
                                                  └─────────────────┘
```

### Spring Boot (Java) — `backend-api/`

Owns:
- REST API surface the frontend talks to
- PostgreSQL persistence: incidents, maintenance reports, shift handoffs,
  resolved-knowledge records
- Request orchestration: receives operator input, calls the LangGraph
  service, persists the result, returns it to the frontend

Does NOT do: any LLM calls, any agent reasoning, any tool execution.

### LangGraph Service (Python) — `agent-service/`

Owns:
- The actual reasoning graph (see `docs/agent-graph.md` once written)
- Tool implementations: retrieve manual, search similar incidents,
  Tavily web search, generate maintenance report, generate shift handoff
- Calls to Featherless AI for all LLM reasoning steps
- State management across a single agent run

Does NOT do: persistence ownership (it returns structured results to
Spring Boot, which persists them), does NOT talk to the frontend directly.

### Frontend — `frontend/`

React. Conversational interface. Streams the agent's reasoning steps
live (tool calls, intermediate findings) rather than just a final
answer — this is the single highest-impact demo decision: judges should
*see* the agent think, not just receive a result.

Explicitly not a dashboard. No KPI cards.

### Database — PostgreSQL

Single source of truth for everything the agent has ever learned.
Schema covers: incidents, maintenance reports, shift handoffs, and a
resolved-knowledge table that's what makes "tribal knowledge transfer"
real instead of a slide bullet — see `docs/schema.md`.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React |
| API layer | Spring Boot (Java 17+) |
| Agent framework | LangGraph (Python 3.11+) |
| LLM | Featherless AI |
| Web search tool | Tavily |
| Database | PostgreSQL |
| Local orchestration | Docker Compose |

## What makes this submission different

Most teams at this event will build a RAG-based PDF Q&A bot and call it
an agent. Three deliberate choices separate this build:

1. **Visible branching reasoning.** The LangGraph graph has real
   conditional edges — low-confidence diagnoses trigger an additional
   search step before answering, rather than always running the same
   fixed pipeline. This is shown live in the UI as it happens.
2. **Compounding knowledge, demoed live.** The same alarm triggered
   twice in the demo resolves visibly faster the second time, because
   the agent retrieves and uses its own prior resolution. This is the
   "tribal knowledge preserved" claim made literal, on stage, not
   asserted in a pitch slide.
3. **Two genuinely deep tools instead of five shallow ones.** Manual
   retrieval and incident search are built with real seeded data and
   work end-to-end. Report generation and shift handoff generation are
   prompt-engineered carefully rather than left as generic LLM output.

## Local setup

### Prerequisites

```bash
java -version      # 17+
mvn -version        # or gradle -version
python3 --version   # 3.11+
node -v
docker -v
```

### Environment variables

Copy and fill in before running anything:

```bash
cp agent-service/.env.example agent-service/.env
cp backend-api/.env.example backend-api/.env
cp frontend/.env.example frontend/.env
```

Required keys: `FEATHERLESS_API_KEY`, `TAVILY_API_KEY`, `DATABASE_URL`.

### Running locally

```bash
docker compose up -d db          # Postgres only, for local dev

cd agent-service
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd backend-api
mvn spring-boot:run             # runs on :8080

cd frontend
npm install && npm run dev      # runs on :5173
```

## Project structure

```
factoryflow-ai/
├── frontend/              # React conversational UI
├── backend-api/           # Spring Boot — API, persistence, orchestration
├── agent-service/         # Python LangGraph — agent reasoning, tools
├── docs/
│   ├── agent-graph.md      # LangGraph node/edge design
│   ├── schema.md           # PostgreSQL schema
│   └── demo-script.md      # the live demo flow, written out
└── docker-compose.yml
```

## Build plan (18 hours, from the original brief)

| Hours | Focus |
|---|---|
| 1–2 | Architecture finalized, repos scaffolded, DB schema |
| 3–5 | Spring Boot APIs + PostgreSQL integration |
| 6–9 | Manual ingestion + RAG pipeline |
| 10–13 | LangGraph workflow, tool calling, branching reasoning |
| 14–15 | Maintenance report + shift handoff generation |
| 16–17 | UI polish, live-reasoning stream, demo data seeded |
| 18 | Pitch prep, final run-through |

## Demo scenario (target)

1. Operator types: "Packaging line stopped. Alarm E217." (night shift)
2. Agent streams its reasoning live: retrieving manual → searching
   incidents → calling Tavily → diagnosing → generating report.
3. Agent returns: probable cause, recommended fix, similar incident
   count, estimated downtime, full maintenance report, shift handoff note.
4. Same alarm triggered again ("morning shift") — agent immediately
   surfaces last night's resolution, resolves faster, visibly.
