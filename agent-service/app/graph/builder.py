"""
Wires all ten nodes into the full FactoryFlow agent graph.

Fast path  (known fix found):
    parse_alarm → search_known → use_known_fix → generate_report → generate_handoff → persist_knowledge → END

Deep path  (no prior fix):
    parse_alarm → search_known → retrieve_manual → search_incidents
        → [branch_confidence]
            HIGH → generate_diagnosis → generate_report → generate_handoff → persist_knowledge → END
            LOW  → web_search        → generate_diagnosis → ...same...

The branching is what makes this defensibly an agent rather than a pipeline —
every branch maps to a real decision a human technician would make.
"""

from langgraph.graph import StateGraph, START, END

from app.graph.state import AgentState
from app.graph.nodes_parse import parse_alarm
from app.graph.nodes_classify_severity import classify_severity
from app.graph.nodes_search_known import search_known, route_known_fix
from app.graph.nodes_use_known import use_known_fix
from app.graph.nodes_retrieve_manual import retrieve_manual
from app.graph.nodes_search_incidents import search_incidents
from app.graph.nodes_web_search import web_search
from app.graph.nodes_generate_diagnosis import generate_diagnosis
from app.graph.nodes_generate_report import generate_report
from app.graph.nodes_generate_handoff import generate_handoff
from app.graph.nodes_persist_knowledge import persist_knowledge


def _route_confidence(state: AgentState) -> str:
    """Conditional edge after search_incidents.

    High-confidence signal = exact alarm_codes match in manual OR
    2+ prior incidents with consistent resolution.
    Route to web_search only when both signals are weak.
    """
    manual_result = state.get("manual_result")
    incident_results = state.get("incident_results", [])

    has_exact_manual = (
        manual_result is not None
        and manual_result.get("source") == "exact_alarm_code_match"
    )
    has_multiple_incidents = len(incident_results) >= 2

    if has_exact_manual or has_multiple_incidents:
        return "generate_diagnosis"
    return "web_search"


def build_full_graph():
    graph = StateGraph(AgentState)

    # ── Nodes ───────────────────────────────────────────────────────────────
    graph.add_node("parse_alarm", parse_alarm)
    graph.add_node("classify_severity", classify_severity)
    graph.add_node("search_known", search_known)
    graph.add_node("use_known_fix", use_known_fix)
    graph.add_node("retrieve_manual", retrieve_manual)
    graph.add_node("search_incidents", search_incidents)
    graph.add_node("web_search", web_search)
    graph.add_node("generate_diagnosis", generate_diagnosis)
    graph.add_node("generate_report", generate_report)
    graph.add_node("generate_handoff", generate_handoff)
    graph.add_node("persist_knowledge", persist_knowledge)

    # ── Edges ────────────────────────────────────────────────────────────────
    graph.add_edge(START, "parse_alarm")
    graph.add_edge("parse_alarm", "classify_severity")
    graph.add_edge("classify_severity", "search_known")

    # Branch 1: known fix vs. deep search
    graph.add_conditional_edges(
        "search_known",
        route_known_fix,
        {
            "use_known_fix": "use_known_fix",
            "deep_search": "retrieve_manual",   # map the string to the node name
        },
    )

    # Fast path rejoins at generate_report
    graph.add_edge("use_known_fix", "generate_report")

    # Deep path: sequential manual → incidents → confidence branch
    graph.add_edge("retrieve_manual", "search_incidents")

    # Branch 2: enough context vs. need web search
    graph.add_conditional_edges(
        "search_incidents",
        _route_confidence,
        {
            "generate_diagnosis": "generate_diagnosis",
            "web_search": "web_search",
        },
    )
    graph.add_edge("web_search", "generate_diagnosis")
    graph.add_edge("generate_diagnosis", "generate_report")

    # Both paths converge at generate_report → handoff → persist → END
    graph.add_edge("generate_report", "generate_handoff")
    graph.add_edge("generate_handoff", "persist_knowledge")
    graph.add_edge("persist_knowledge", END)

    return graph.compile()


# Module-level compiled graph — imported by app/main.py
agent_graph = build_full_graph()
