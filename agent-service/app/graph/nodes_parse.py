"""
First node in the graph. Takes free-text operator input and extracts
structured fields: alarm code, machine reference. This is a single,
tightly-scoped LLM call (extraction, not open generation) so it should
be fast and cheap relative to the diagnosis/report-generation calls
later in the graph.
"""

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.llm import get_llm
from app.graph.state import AgentState, log_step

EXTRACTION_PROMPT = """You extract structured fields from manufacturing \
operator messages. Given the operator's input, return ONLY a JSON object \
with these exact keys, no other text:

{
  "alarm_code": "<the alarm/error code mentioned, e.g. E217, or null if none>",
  "machine_name": "<the machine name/reference mentioned, e.g. 'Packaging Line B', or null if none>",
  "machine_type": "<inferred general machine type if determinable, e.g. 'Press Machine', or null>"
}

Only output the JSON object. No markdown fences, no explanation."""


def _extract_json(text: str) -> dict:
    """LLMs sometimes wrap JSON in markdown fences despite instructions —
    strip those defensively rather than letting json.loads fail on them."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


def parse_alarm(state: AgentState) -> dict:
    llm = get_llm(temperature=0.0)  # deterministic extraction, not creative generation

    response = llm.invoke(
        [
            SystemMessage(content=EXTRACTION_PROMPT),
            HumanMessage(content=state["operator_input"]),
        ]
    )

    try:
        parsed = _extract_json(response.content)
    except (json.JSONDecodeError, AttributeError):
        # Fall back gracefully — don't crash the whole graph on a bad
        # extraction. Downstream nodes should handle alarm_code=None.
        parsed = {"alarm_code": None, "machine_name": None, "machine_type": None}

    step = log_step(
        state,
        node_name="parse_alarm",
        input_summary=state["operator_input"],
        output_summary=f"Extracted: alarm_code={parsed.get('alarm_code')}, "
        f"machine={parsed.get('machine_name')}",
    )

    return {
        "alarm_code": parsed.get("alarm_code"),
        "machine_type": parsed.get("machine_type"),
        "reasoning_log": state["reasoning_log"] + [step],
    }
