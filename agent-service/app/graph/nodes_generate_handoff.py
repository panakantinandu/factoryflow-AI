"""
Generates the shift handoff note. Prompt is designed to sound like something
a foreman actually writes at end-of-shift — direct, specific, no filler.
Few-shot tone is baked into the system prompt rather than examples to save
tokens at event time.
"""

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.llm import get_llm
from app.graph.state import AgentState, log_step

HANDOFF_PROMPT = """Write a shift handoff note for the next maintenance crew.
Direct, practical language — the way a foreman who's been on the floor for 15 years writes.
No corporate speak, no passive voice, no filler.

Return ONLY a valid JSON object with these exact keys — no markdown, no explanation:
{
  "machine_status": "<specific status: e.g. 'Running — monitor temp sensor', 'Down — waiting on part #A217', 'Repaired and back in service'>",
  "actions_taken": "<what was actually done this shift, numbered if multiple steps>",
  "pending_work": "<what still needs doing next shift, or 'None — resolved'>",
  "recommendations_next": "<specific things next shift must watch for or check>"
}"""


def _extract_json(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


def generate_handoff(state: AgentState) -> dict:
    diagnosis = state.get("diagnosis") or {}
    report = state.get("report") or {}
    alarm_code = state.get("alarm_code") or "unknown"
    machine_type = state.get("machine_type") or "unspecified machine"
    shift = state.get("shift") or "current shift"

    context = (
        f"Machine: {machine_type}\n"
        f"Alarm: {alarm_code}\n"
        f"Shift: {shift}\n"
        f"Issue: {diagnosis.get('probable_cause', 'Alarm triggered — see report')}\n"
        f"Fix Applied: {diagnosis.get('recommended_fix', 'See report')}\n"
        f"Confidence: {float(diagnosis.get('confidence_score', 0.0)):.0%}\n"
        f"Downtime: {report.get('downtime_minutes', diagnosis.get('estimated_downtime_minutes', 'Unknown'))} minutes\n"
        f"Summary: {report.get('issue_summary', '')}\n"
        f"Recommendations: {report.get('recommendations', '')}"
    )

    llm = get_llm(temperature=0.3)
    response = llm.invoke(
        [
            SystemMessage(content=HANDOFF_PROMPT),
            HumanMessage(content=context),
        ]
    )

    try:
        handoff = _extract_json(response.content)
    except (json.JSONDecodeError, AttributeError):
        handoff = {
            "machine_status": "See maintenance report for current status",
            "actions_taken": report.get("resolution_steps", "See report"),
            "pending_work": "None — resolved",
            "recommendations_next": report.get("recommendations", "Monitor machine"),
        }

    step = log_step(
        state,
        node_name="generate_handoff",
        input_summary=f"Writing shift handoff for {machine_type} ({alarm_code})",
        output_summary=f"Handoff ready — status: {handoff.get('machine_status', 'See report')}",
        tool_called="featherless_llm",
    )

    return {"handoff": handoff, "reasoning_log": state["reasoning_log"] + [step]}
