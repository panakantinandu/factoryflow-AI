"""
FastAPI entry point for the FactoryFlow AI agent service.

Endpoints:
  POST /invoke  — synchronous; waits for full graph completion, returns all outputs
  POST /stream  — SSE streaming; pushes each reasoning step as it's produced
  GET  /health  — liveness check
"""

import json
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.config import settings
from app.graph.builder import agent_graph
from app.graph.state import initial_state

app = FastAPI(title="FactoryFlow AI Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",  # Spring Boot during dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InvokeRequest(BaseModel):
    operator_input: str
    shift: Optional[str] = None


@app.post("/invoke")
def invoke(req: InvokeRequest):
    """Run the full agent graph synchronously and return all outputs at once."""
    state = initial_state(req.operator_input, req.shift)
    result = agent_graph.invoke(state)
    return {
        "alarm_code": result.get("alarm_code"),
        "machine_type": result.get("machine_type"),
        "severity": result.get("severity"),
        "diagnosis": result.get("diagnosis"),
        "report": result.get("report"),
        "handoff": result.get("handoff"),
        "confidence_score": result.get("confidence_score"),
        "reasoning_log": result.get("reasoning_log", []),
    }


@app.post("/stream")
async def stream(req: InvokeRequest):
    """SSE endpoint — yields each reasoning step as the graph executes.

    The React frontend opens this as an EventSource and renders steps
    in real-time so users see the agent 'thinking' rather than waiting
    for a blank screen to resolve.
    """
    state = initial_state(req.operator_input, req.shift)

    async def event_generator():
        seen_steps = 0
        async for chunk in agent_graph.astream(state):
            for _node_name, node_output in chunk.items():
                log = node_output.get("reasoning_log", [])
                # Only send newly appended steps, not the full accumulating list
                for step in log[seen_steps:]:
                    yield f"data: {json.dumps(step)}\n\n"
                seen_steps = max(seen_steps, len(log))

                # If this chunk has final outputs, send them as a special event
                if node_output.get("diagnosis"):
                    yield (
                        f"event: result\n"
                        f"data: {json.dumps({'diagnosis': node_output.get('diagnosis'), 'report': node_output.get('report'), 'handoff': node_output.get('handoff'), 'confidence_score': node_output.get('confidence_score')})}\n\n"
                    )

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/health")
def health():
    return {"status": "ok", "model": settings.featherless_model}
