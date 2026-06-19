"""
Classifies alarm severity before the known-fix lookup. No LLM call —
keyword heuristics are fast and deterministic, which matters here since
this fires on every request.

Severity levels:
  CRITICAL — immediate safety or production-stop risk
  HIGH     — machine down, production halted
  MEDIUM   — degraded performance, recurring fault
  LOW      — intermittent, non-blocking, informational

Impact on routing: CRITICAL severity bypasses the fast-path (use_known_fix)
even when a validated known fix exists, because re-confirming via deep
search is worth the extra time when safety is involved.
"""

from app.graph.state import AgentState, log_step

_SEVERITY_MAP = {
    "CRITICAL": [
        "fire", "smoke", "explosion", "electrical", "short circuit",
        "arc", "burn", "injury", "safety", "emergency", "evacuation",
        "gas leak", "sparks", "melting",
    ],
    "HIGH": [
        "stopped", "not running", "production halt", "complete failure",
        "line down", "down", "unresponsive", "no power", "won't start",
        "total loss", "critical",
    ],
    "MEDIUM": [
        "alarm", "error", "fault", "warning", "slow", "intermittent",
        "repeated", "recurring", "keeps", "again", "third time",
    ],
    "LOW": [
        "noise", "vibration", "minor", "occasional", "check",
        "slight", "small", "investigate",
    ],
}


def _classify(text: str) -> str:
    lower = text.lower()
    for level in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
        if any(kw in lower for kw in _SEVERITY_MAP[level]):
            return level
    return "MEDIUM"  # default when nothing matches


def classify_severity(state: AgentState) -> dict:
    severity = _classify(state["operator_input"])

    step = log_step(
        state,
        node_name="classify_severity",
        input_summary=state["operator_input"][:120],
        output_summary=(
            f"Severity: {severity}"
            + (" — will force deep search to verify" if severity == "CRITICAL" else "")
        ),
    )

    return {"severity": severity, "reasoning_log": state["reasoning_log"] + [step]}
