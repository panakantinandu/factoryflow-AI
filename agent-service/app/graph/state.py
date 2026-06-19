"""
The state object passed between every node in the graph. Matches the
shape defined in docs/agent-graph.md — keep these in sync if you change
one.

reasoning_log is what powers the live-streaming UI feature: every node
appends an entry here before passing state forward. The API layer
streams these as they happen (via FastAPI's StreamingResponse) rather
than waiting for the full graph to finish before responding.
"""

from typing import Optional
from typing_extensions import TypedDict


class ReasoningStep(TypedDict):
    node_name: str
    tool_called: Optional[str]
    input_summary: str
    output_summary: str


class AgentState(TypedDict):
    # Input
    operator_input: str
    shift: Optional[str]

    # Parsed from operator_input by parse_alarm node
    alarm_code: Optional[str]
    machine_id: Optional[int]
    machine_type: Optional[str]

    # Set by classify_severity node: CRITICAL / HIGH / MEDIUM / LOW
    # CRITICAL bypasses the fast-path even when a known fix exists
    severity: Optional[str]

    # Populated by search_known node
    known_fix: Optional[dict]

    # Populated by retrieve_manual / search_incidents nodes
    manual_result: Optional[dict]
    incident_results: list[dict]

    # Populated by web_search node (only reached on low-confidence branch)
    web_search_result: Optional[dict]

    # Set by branch_confidence logic
    confidence_score: float

    # Final outputs
    diagnosis: Optional[dict]
    report: Optional[dict]
    handoff: Optional[dict]

    # Appended to by every node — drives the live reasoning UI
    reasoning_log: list[ReasoningStep]


def initial_state(operator_input: str, shift: Optional[str] = None) -> AgentState:
    return AgentState(
        operator_input=operator_input,
        shift=shift,
        alarm_code=None,
        machine_id=None,
        machine_type=None,
        severity=None,
        known_fix=None,
        manual_result=None,
        incident_results=[],
        web_search_result=None,
        confidence_score=0.0,
        diagnosis=None,
        report=None,
        handoff=None,
        reasoning_log=[],
    )


def log_step(
    state: AgentState,
    node_name: str,
    input_summary: str,
    output_summary: str,
    tool_called: Optional[str] = None,
) -> ReasoningStep:
    """Call this at the end of every node to append a reasoning step."""
    step: ReasoningStep = {
        "node_name": node_name,
        "tool_called": tool_called,
        "input_summary": input_summary,
        "output_summary": output_summary,
    }
    return step
