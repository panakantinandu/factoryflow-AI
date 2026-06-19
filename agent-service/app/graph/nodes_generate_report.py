"""
Generates the structured maintenance report. This is the output judges will
read most closely — prompt is written to produce foreman-quality prose, not
generic LLM filler. Both fast-path and deep-search converge here.
"""

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.llm import get_llm
from app.graph.state import AgentState, log_step

REPORT_PROMPT = """You are writing a maintenance incident report for a manufacturing facility.
Write it like a professional maintenance engineer — precise, factual, no corporate filler.

Return ONLY a valid JSON object with these exact keys — no markdown, no explanation:
{
  "issue_summary": "<1-2 sentences: what happened and on which machine>",
  "root_cause": "<technical root cause, specific enough to be useful>",
  "resolution_steps": "<numbered steps taken to resolve, past tense>",
  "parts_replaced": "<list any parts replaced, or 'None'>",
  "downtime_minutes": <integer>,
  "recommendations": "<specific preventive measures or follow-up actions for this machine>"
}"""


def _extract_json(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


def generate_report(state: AgentState) -> dict:
    diagnosis = state.get("diagnosis") or {}
    alarm_code = state.get("alarm_code") or "unknown"
    machine_type = state.get("machine_type") or "unspecified machine"

    context = (
        f"Machine: {machine_type}\n"
        f"Alarm Code: {alarm_code}\n"
        f"Operator Report: {state['operator_input']}\n"
        f"Probable Cause: {diagnosis.get('probable_cause', 'Unknown')}\n"
        f"Recommended Fix: {diagnosis.get('recommended_fix', 'Unknown')}\n"
        f"Confidence: {float(diagnosis.get('confidence_score', 0.0)):.0%}\n"
        f"Estimated Downtime: {diagnosis.get('estimated_downtime_minutes', 'Unknown')} minutes"
    )

    llm = get_llm(temperature=0.2)
    response = llm.invoke(
        [
            SystemMessage(content=REPORT_PROMPT),
            HumanMessage(content=context),
        ]
    )

    try:
        report = _extract_json(response.content)
    except (json.JSONDecodeError, AttributeError):
        report = {
            "issue_summary": f"Alarm {alarm_code} triggered on {machine_type}.",
            "root_cause": diagnosis.get("probable_cause", "Unknown"),
            "resolution_steps": diagnosis.get("recommended_fix", "See diagnosis"),
            "parts_replaced": "None",
            "downtime_minutes": diagnosis.get("estimated_downtime_minutes", 60),
            "recommendations": "Monitor machine and follow up with maintenance team",
        }

    step = log_step(
        state,
        node_name="generate_report",
        input_summary=f"Generating maintenance report for alarm {alarm_code} on {machine_type}",
        output_summary=f"Report ready: {report.get('issue_summary', '')[:80]}",
        tool_called="featherless_llm",
    )

    return {"report": report, "reasoning_log": state["reasoning_log"] + [step]}
