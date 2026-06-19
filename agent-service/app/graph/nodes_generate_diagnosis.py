"""
Synthesizes all gathered context (manual section, incident history, optional
web search) into a structured diagnosis. This is the core LLM reasoning call
for the deep-search path — the prompt is engineered to produce a JSON response
that matches the same shape use_known_fix produces, so downstream nodes
(generate_report, generate_handoff) don't need to know which path was taken.
"""

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.llm import get_llm
from app.graph.state import AgentState, log_step

DIAGNOSIS_PROMPT = """You are an expert manufacturing maintenance engineer AI.
Analyze the provided context about a machine alarm and produce a precise diagnosis.

Return ONLY a valid JSON object with these exact keys — no markdown fences, no explanation:
{
  "probable_cause": "<concise technical explanation of what caused this alarm>",
  "recommended_fix": "<numbered step-by-step fix a technician can follow>",
  "confidence_score": <float between 0.0 and 1.0>,
  "estimated_downtime_minutes": <integer>,
  "reasoning": "<one sentence explaining why you concluded this cause>"
}"""


def _extract_json(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


def generate_diagnosis(state: AgentState) -> dict:
    alarm_code = state.get("alarm_code") or "unknown"
    machine_type = state.get("machine_type") or "unspecified machine"
    manual_result = state.get("manual_result")
    incident_results = state.get("incident_results", [])
    web_search_result = state.get("web_search_result")

    context_parts = [
        f"Alarm Code: {alarm_code}",
        f"Machine Type: {machine_type}",
        f"Operator Report: {state['operator_input']}",
    ]

    if manual_result:
        context_parts.append(
            f"\nManual Section — {manual_result.get('section_title', 'N/A')} "
            f"(from {manual_result.get('manual_title', 'unknown')}):\n"
            f"{manual_result.get('content', '')[:2000]}"
        )

    if incident_results:
        lines = "\n".join(
            f"  {i + 1}. Cause: {r.get('probable_cause', 'N/A')} | "
            f"Fix: {r.get('recommended_fix', 'N/A')}"
            for i, r in enumerate(incident_results[:3])
        )
        context_parts.append(f"\nPrior Resolved Incidents:\n{lines}")

    if web_search_result and web_search_result.get("content"):
        context_parts.append(
            f"\nWeb Search Results:\n{web_search_result['content'][:2000]}"
        )

    context = "\n".join(context_parts)

    llm = get_llm(temperature=0.1)
    response = llm.invoke(
        [
            SystemMessage(content=DIAGNOSIS_PROMPT),
            HumanMessage(content=context),
        ]
    )

    try:
        parsed = _extract_json(response.content)
    except (json.JSONDecodeError, AttributeError):
        parsed = {
            "probable_cause": "Could not determine — insufficient context",
            "recommended_fix": "Consult manual and contact OEM support",
            "confidence_score": 0.2,
            "estimated_downtime_minutes": 60,
            "reasoning": "LLM parse failure",
        }

    diagnosis = {**parsed, "source": "deep_search"}
    confidence_score = float(parsed.get("confidence_score", 0.5))

    step = log_step(
        state,
        node_name="generate_diagnosis",
        input_summary=f"Synthesizing diagnosis from {len(context_parts)} context sources",
        output_summary=(
            f"Diagnosis: {parsed.get('probable_cause', '')[:80]} "
            f"(confidence {confidence_score:.0%})"
        ),
        tool_called="featherless_llm",
    )

    return {
        "diagnosis": diagnosis,
        "confidence_score": confidence_score,
        "reasoning_log": state["reasoning_log"] + [step],
    }
