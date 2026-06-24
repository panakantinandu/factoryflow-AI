# FactoryFlow AI

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║    ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗    ║
║    ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝   ║
║    █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝     ║
║    ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝      ║
║    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║       ║
║    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ║
║                                                                      ║
║              F L O W  ·  A I  —  Manufacturing Copilot              ║
╚══════════════════════════════════════════════════════════════════════╝
```

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Agent-FF6B35?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)

> **AI-powered manufacturing operations copilot.** Diagnoses machine alarms through autonomous multi-step reasoning, retrieves institutional knowledge, generates maintenance documentation, and preserves tribal knowledge — compounding in value with every resolved incident.

---

## What It Looks Like

```
┌─ FactoryFlow AI ────────────────────────────────────────────────────────────┐
│                                                                              │
│  ◈  FactoryFlow     ┊  Diagnose Alarm                                       │
│  ── ──────────────  ┊  ─────────────────────────────────────────────────── │
│  ◆  Diagnose        ┊  Describe the machine alarm in plain language          │
│  ▣  Dashboard       ┊                                                        │
│  ⊟  History         ┊  ┌─────────────────────────────────────────────────┐  │
│  ◇  Knowledge       ┊  │ SHIFT  [ Day ]  [ Evening ]  [ Night ]  ⊞ file  │  │
│                     ┊  │                                                   │  │
│                     ┊  │  Packaging line alarm E217 — Line B,             │  │
│                     ┊  │  keeps stopping mid-cycle, night shift           │  │
│                     ┊  │                                      Ctrl+Enter  │  │
│                     ┊  │                                      [ Diagnose ]│  │
│                     ┊  └─────────────────────────────────────────────────┘  │
│                     ┊                                                        │
│                     ┊  ╭─ ● ● ●  agent reasoning trace ──────── ● running ─╮│
│                     ┊  │                                                     ││
│                     ┊  │  ◈ parse_alarm                                     ││
│                     ┊  │  │  Alarm E217 · Packaging Line B · Night shift    ││
│                     ┊  │  │                                                  ││
│                     ┊  │  ⌗ search_known ──→ knowledge_db                   ││
│                     ┊  │  │  Found 3 prior resolutions — 82% match          ││
│                     ┊  │  │                                                  ││
│                     ┊  │  ✓ use_known_fix                                   ││
│                     ┊  │  │  Fast path · bypassing deep search              ││
│                     ┊  │  │                                                  ││
│                     ┊  │  ◆ generate_diagnosis ──→ llm                      ││
│                     ┊  │  │  Synthesising from validated fix + context      ││
│                     ┊  │  │                                                  ││
│                     ┊  │  ▣ generate_report                                 ││
│                     ┊  │  │  Writing structured maintenance report           ││
│                     ┊  │  │                                                  ││
│                     ┊  │  ▤ generate_handoff                                ││
│                     ┊  │     Composing shift handoff note                   ││
│                     ┊  │                                                     ││
│                     ┊  ╰─────────────────────────────────────────────────── ╯│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## The Problem

Manufacturing operators lose **20–60 minutes per alarm** doing this manually:

```
  Alarm fires        Search PDF manual     Find nothing     Call senior tech
      │                     │                   │                  │
      ▼                     ▼                   ▼                  ▼
  ⚠  E217          📄 flipping pages      😤 not there      📞 at 2 AM
      │
      │   Next shift — same alarm fires again
      ▼
  All knowledge lost. Starts from zero.
```

Four compounding failures:
- **No retrieval** — manuals exist as PDFs nobody can search fast under pressure
- **No memory** — prior resolutions live in someone's head or a notebook
- **No documentation** — maintenance reports written manually, slowly, inconsistently
- **No handoff** — tribal knowledge evaporates when experienced technicians leave

---

## What FactoryFlow AI Does

```
  Alarm fires        FactoryFlow AI        Result
      │                    │                 │
      ▼                    ▼                 ▼
  ⚠  E217    ──►  ◈ Parses alarm      ◆ Probable cause
                   ⌗ Searches KB      ◆ Recommended fix
                   ⊞ Reads manual     ◆ Confidence score
                   ⊟ Checks history   ▣ Maintenance report
                   ⊕ Web search       ▤ Shift handoff note
                   ◆ Generates Dx     ▲ Knowledge stored
                        │
                   Same alarm tomorrow?
                        │
                        ▼
                   ✓  FAST PATH — resolved in seconds, not minutes
```

---

## Agent Reasoning Graph

The core of the system is a **LangGraph state machine** with real conditional branching — not a fixed pipeline.

```
                         Operator Input
                               │
                    ┌──────────▼──────────┐
                    │    parse_alarm      │  ◈  Extract alarm code,
                    │                     │     machine type, shift
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   search_known      │  ⌗  Query resolved-knowledge
                    │   (knowledge DB)    │     table for prior fixes
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                  │
       confidence ≥ 60%                   confidence < 60%
              │                                  │
    ┌─────────▼──────────┐          ┌────────────▼────────────┐
    │   use_known_fix    │  ✓ green │   retrieve_manual       │  ⊞ yellow
    │   FAST PATH        │          │   search_incidents      │  ⊟ orange
    │   ~seconds         │          │   web_search (Tavily)   │  ⊕ pink
    └─────────┬──────────┘          └────────────┬────────────┘
              │                                   │
              └──────────────┬────────────────────┘
                             │
                    ┌────────▼────────┐
                    │generate_diagnosis│  ◆  Synthesise diagnosis
                    │    (LLM call)    │     with confidence score
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ generate_report │  ▣  Structured maintenance
                    │                 │     report for records
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │generate_handoff │  ▤  Shift handoff note
                    │                 │     for incoming operators
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │persist_knowledge│  ▲  Distill & store fix
                    │                 │     for next time
                    └─────────────────┘
```

**Key branches:**
- `CRITICAL` severity → **forces** deep search regardless of knowledge match
- Confidence < 60% → additional tools called before diagnosing
- Prior resolution found → fast path skips manual + web search entirely

---

## Knowledge Compounding

The same alarm gets faster to resolve every time it recurs:

```
  Alarm E217 — first occurrence
  ─────────────────────────────────────────────────────────────
  parse_alarm → search_known (miss) → retrieve_manual → search_incidents
              → web_search → generate_diagnosis → generate_report
              → generate_handoff → persist_knowledge

  Time: ~45 seconds   Confidence: 71%   Source: deep_search


  Alarm E217 — second occurrence (tomorrow, different shift)
  ─────────────────────────────────────────────────────────────
  parse_alarm → search_known (HIT ✓) → use_known_fix → generate_diagnosis
              → generate_report → generate_handoff → persist_knowledge

  Time: ~8 seconds    Confidence: 94%   Source: known_resolution
                                         times_previously_resolved: 1


  Alarm E217 — fifth occurrence (weeks later)
  ─────────────────────────────────────────────────────────────
  parse_alarm → search_known (HIT ✓✓✓) → use_known_fix
              → generate_diagnosis → ...

  Time: ~6 seconds    Confidence: 97%   Source: known_resolution
                                         times_previously_resolved: 4
```

**This compounds across the entire fleet** — a fix found for Machine A on Line 1 can match an alarm on Machine B on Line 3 if the alarm code and machine type align.

---

## Animated File Reader

Operators can attach alarm logs, shift reports, or machine data files directly in the UI. The file is read with a terminal-style scanning animation:

```
  ╭──── ⊞ READING FILE ────────────────────────────────────────╮
  │  alarm_log_shift_B.txt                            12.3 KB  │
  │                                                             │
  │  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░   48%               │
  │                                                             │
  │  ←━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━→  │
  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← scan line
  │                                                             │
  │  0000: 7A 3F 8B 2C FF 01 A4 58 3E 7B C2 D5               │
  │  000C: 29 CC 8F 12 4A 9D 06 E3 51 78 B4 1A               │
  │  0018: B2 44 7E 90 33 FC 11 8D 6A 05 3E 91               │
  │  0024: E8 72 1B A9 5D 00 C6 3A 47 BE F0 2C               │
  │  0030: 94 67 2E F4 88 19 73 D5 4C B1 08 6F               │
  │                                                             │
  │  ▌ reading bytes…                    2A4F 6B12 1F8E        │
  ╰─────────────────────────────────────────────────────────────╯

  ╭──── ✓ READ COMPLETE ────────────────────────────────────────╮
  │  alarm_log_shift_B.txt                            12.3 KB  │
  │                                                             │
  │  ████████████████████████████████████  100%                 │
  │                                                             │
  │  ● Read complete — injecting into input field               │
  ╰─────────────────────────────────────────────────────────────╯
```

Supported formats: `.txt` `.log` `.csv` `.json` `.yaml` `.xml` `.md` `.py` `.js` `.ts`

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │            React Frontend  (:5173)                 │    │
│   │  Diagnose · Dashboard · History · Knowledge        │    │
│   │  Live reasoning stream (SSE) · File reader         │    │
│   └───────────────────┬────────────────────────────────┘    │
└───────────────────────┼──────────────────────────────────────┘
                        │  REST / SSE
          ┌─────────────▼─────────────┐
          │   Spring Boot API  (:8080) │  Java 17
          │                            │
          │  • REST endpoints          │
          │  • PostgreSQL persistence  │
          │  • Orchestration layer     │
          │  • No LLM calls here       │
          └───────────┬───────────────┘
                      │  HTTP  (stream + sync)
          ┌───────────▼───────────────┐
          │  LangGraph Agent  (:8000) │  Python 3.11
          │                            │
          │  • Reasoning graph         │
          │  • Tool implementations    │
          │  • LLM calls               │
          │  • SSE streaming output    │
          └──────┬──────────┬─────────┘
                 │          │
    ┌────────────▼──┐   ┌───▼───────────────┐
    │  PostgreSQL   │   │  External APIs     │
    │               │   │                   │
    │  incidents    │   │  Featherless AI   │
    │  reports      │   │  (LLM inference)  │
    │  handoffs     │   │                   │
    │  knowledge    │   │  Tavily           │
    └───────────────┘   │  (web search)     │
                        └───────────────────┘
```

**Intentionally polyglot:** Java owns transactional integrity and the API surface. Python owns AI orchestration. LangGraph has no mature Java equivalent — splitting responsibilities is a stronger engineering decision than forcing one language.

---

## Pages

| Page | What it shows |
|---|---|
| **Diagnose** | Submit an alarm, watch agent reasoning live, receive diagnosis + report + handoff |
| **Dashboard** | KPI cards (total incidents, MTTR, fast-path rate, time saved), alarm frequency chart, machine health board |
| **History** | Paginated incident log with alarm code filter, status filter, expandable row details |
| **Knowledge** | All distilled fixes — alarm code, reuse count, last used, expandable cause + fix + delete |

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Conversational UI, live reasoning stream |
| Styling | Tailwind CSS + JetBrains Mono | Dark factory terminal aesthetic |
| Charts | Recharts | Dashboard KPI visualisations |
| API layer | Spring Boot 3 (Java 17) | REST surface, persistence, orchestration |
| Agent framework | LangGraph (Python 3.11) | Reasoning graph, conditional branching |
| LLM | Featherless AI | All inference calls from the agent |
| Web search | Tavily | Real-time web search tool node |
| Database | PostgreSQL | Incidents, reports, handoffs, knowledge |
| Infra | Docker Compose | Local dev: one command to start everything |

---

## What Makes This Different

Most teams at this event will build a RAG-based PDF Q&A bot and call it an agent. Three deliberate choices separate this:

### 1. Visible Branching Reasoning

```
  Basic RAG bot:         Input → LLM → Output
                         (same path every time, no decisions)

  FactoryFlow AI:        Input → parse → search → confidence check
                                            │
                                    ┌───────┴───────┐
                                    │               │
                               fast path        deep search
                               (known fix)   (manual + web)
                                    │               │
                                    └───────┬───────┘
                                            │
                                       diagnose → report → handoff
```

LangGraph conditional edges are visible in the UI **live**, as they happen.

### 2. Compounding Knowledge, Demonstrated on Stage

```
  Demo run 1:  E217 → 45 seconds → deep search → fix found → stored
  Demo run 2:  E217 →  8 seconds → FAST PATH   → same fix  → reuse count: 1

  The improvement is visible. It's not claimed in a slide. It happens on stage.
```

### 3. Two Deep Tools Instead of Five Shallow Ones

```
  ✓  Manual retrieval     — real seeded data, works end-to-end
  ✓  Incident search      — queries actual PostgreSQL history
  ✓  Report generation    — structured, carefully prompt-engineered
  ✓  Shift handoff        — specific format operators actually use
  ✓  Tavily web search    — real-time fallback for unknown alarms
```

---

## Getting Started

### Prerequisites

```bash
java -version         # 17+
python3 --version     # 3.11+
node -v               # 18+
docker -v             # for PostgreSQL
```

### Environment Setup

```bash
# Copy env templates
cp agent-service/.env.example agent-service/.env
cp backend-api/.env.example  backend-api/.env
cp frontend/.env.example     frontend/.env
```

Fill in your keys:

```env
# agent-service/.env
FEATHERLESS_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here

# backend-api/.env
DATABASE_URL=jdbc:postgresql://localhost:5432/factoryflow
DB_USERNAME=postgres
DB_PASSWORD=postgres

# frontend/.env
VITE_AGENT_URL=http://localhost:8000
VITE_API_URL=http://localhost:8080/api
```

### Run Locally

```bash
# 1 — Start PostgreSQL
docker compose up -d db

# 2 — Start the LangGraph agent service
cd agent-service
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3 — Start the Spring Boot API (new terminal)
cd backend-api
mvn spring-boot:run               # runs on :8080

# 4 — Start the frontend (new terminal)
cd frontend
npm install
npm run dev                       # opens on :5173
```

### Run Everything with Docker

```bash
docker compose up --build
# Frontend:  http://localhost:5173
# API:       http://localhost:8080
# Agent:     http://localhost:8000
```

---

## Project Structure

```
factoryflow-ai/
│
├── frontend/                    # React · TypeScript · Vite
│   └── src/
│       ├── components/
│       │   ├── ChatInput.tsx    # Alarm input + shift selector + file reader
│       │   ├── FileReadZone.tsx # Animated file reading component
│       │   ├── ReasoningStream.tsx  # Live agent step trace
│       │   ├── DiagnosisCard.tsx    # Diagnosis + report + handoff output
│       │   ├── StatCard.tsx         # Dashboard KPI card
│       │   └── Sidebar.tsx          # Navigation
│       ├── pages/
│       │   ├── DiagnosePage.tsx     # Main diagnose interface
│       │   ├── DashboardPage.tsx    # KPIs, charts, machine health
│       │   ├── HistoryPage.tsx      # Paginated incident log
│       │   └── KnowledgePage.tsx    # Knowledge base browser
│       └── lib/
│           └── api.ts               # All API calls + SSE streaming
│
├── backend-api/                 # Spring Boot · Java 17 · PostgreSQL
│   └── src/main/java/
│       ├── controller/          # REST endpoints
│       ├── service/             # Orchestration, agent calls
│       ├── repository/          # JPA repositories
│       └── entity/              # Incident, Report, Handoff, Knowledge
│
├── agent-service/               # Python 3.11 · LangGraph · FastAPI
│   └── app/
│       ├── graph/               # LangGraph nodes and edges
│       ├── tools/               # Manual retrieval, incident search, web
│       ├── prompts/             # LLM prompt templates
│       └── main.py              # FastAPI app + SSE stream endpoint
│
├── docs/
│   ├── agent-graph.md           # LangGraph node/edge design
│   ├── schema.md                # PostgreSQL schema reference
│   └── demo-script.md           # Live demo walkthrough
│
└── docker-compose.yml
```

---

## Demo Walkthrough

```
Step 1 — Operator submits an alarm (Night shift)
──────────────────────────────────────────────────
  Input: "Packaging line alarm E217 — Line B, keeps stopping mid-cycle"

Step 2 — Agent streams reasoning live (first time this alarm is seen)
──────────────────────────────────────────────────
  ◈  parse_alarm        → E217 · Packaging · Night
  ⌗  search_known       → no match (first occurrence)
  ⊞  retrieve_manual    → found section 4.3: conveyor sensor fault
  ⊟  search_incidents   → 0 prior incidents for E217
  ⊕  web_search         → confirmed: photoelectric sensor drift
  ◆  generate_diagnosis → probable cause + recommended fix
  ▣  generate_report    → structured maintenance report
  ▤  generate_handoff   → next shift briefing note
  ▲  persist_knowledge  → fix distilled and stored

  Total: ~45 seconds

Step 3 — Morning shift operator submits the same alarm
──────────────────────────────────────────────────
  Input: "E217 alarm again on Line B"

Step 4 — Fast path engaged
──────────────────────────────────────────────────
  ◈  parse_alarm        → E217 · Packaging
  ⌗  search_known       → ✓ MATCH — confidence 94%
  ✓  use_known_fix      → retrieved last night's validated fix
  ◆  generate_diagnosis → confirmed + contextualised
  ▣  generate_report    → written
  ▤  generate_handoff   → written
  ▲  persist_knowledge  → reuse count: 1

  Total: ~8 seconds
  Knowledge reuses shown in Dashboard → Knowledge Base panel
```

---

## Roadmap

- [ ] Voice input for hands-free alarm entry on the floor
- [ ] Multi-language support (Spanish, German, Mandarin)
- [ ] Predictive alerts — flag machines before alarms fire based on pattern history
- [ ] Mobile-optimised view for tablet use at machine side
- [ ] Export knowledge base to PDF for compliance documentation

---

<div align="center">
  <sub>Built for manufacturing teams who don't have time to search PDFs at 2 AM.</sub>
</div>
