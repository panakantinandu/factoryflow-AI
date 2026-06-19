"""
Pure database lookup, no LLM call needed. Checks resolved_knowledge for
an existing high-confidence fix for this alarm_code (+ machine_type if
available). This is the node that makes the fast path possible — and the
fast path is what makes "tribal knowledge preserved" demonstrable rather
than asserted.

High confidence here means: an entry exists AND has been reused at least
once before (times_reused >= 1). A brand-new, never-validated entry is
treated as not confident enough to skip the deeper search — we don't
want one bad resolution compounding into a habit of trusting it blindly.
"""

from sqlalchemy import text as sql_text

from app.core.database import get_db_session
from app.graph.state import AgentState, log_step


def search_known(state: AgentState) -> dict:
    alarm_code = state.get("alarm_code")

    if not alarm_code:
        step = log_step(
            state,
            node_name="search_known",
            input_summary="No alarm_code extracted, skipping known-fix lookup",
            output_summary="No lookup performed",
        )
        return {"known_fix": None, "reasoning_log": state["reasoning_log"] + [step]}

    db = get_db_session()
    try:
        query = sql_text(
            """
            SELECT id, alarm_code, machine_type, distilled_cause,
                   distilled_fix, times_reused, last_used_at
            FROM resolved_knowledge
            WHERE alarm_code = :alarm_code
              AND (:machine_type IS NULL OR machine_type = :machine_type)
            ORDER BY times_reused DESC, last_used_at DESC
            LIMIT 1
            """
        )
        row = db.execute(
            query,
            {"alarm_code": alarm_code, "machine_type": state.get("machine_type")},
        ).fetchone()
    finally:
        db.close()

    if row is None or row.times_reused < 1:
        step = log_step(
            state,
            node_name="search_known",
            input_summary=f"Looking up resolved_knowledge for alarm_code={alarm_code}",
            output_summary="No validated prior fix found — proceeding to deep search",
            tool_called="search_known",
        )
        return {"known_fix": None, "reasoning_log": state["reasoning_log"] + [step]}

    known_fix = {
        "id": row.id,
        "alarm_code": row.alarm_code,
        "distilled_cause": row.distilled_cause,
        "distilled_fix": row.distilled_fix,
        "times_reused": row.times_reused,
    }

    step = log_step(
        state,
        node_name="search_known",
        input_summary=f"Looking up resolved_knowledge for alarm_code={alarm_code}",
        output_summary=f"Found prior fix, reused {row.times_reused} time(s) before",
        tool_called="search_known",
    )

    return {"known_fix": known_fix, "reasoning_log": state["reasoning_log"] + [step]}


def route_known_fix(state: AgentState) -> str:
    """Conditional edge function: routes to fast path if a validated
    known fix exists, otherwise to the deep-search path.

    CRITICAL severity always forces deep search even when a known fix
    exists — worth the extra time to re-confirm when safety is involved.
    """
    if state.get("severity") == "CRITICAL":
        return "deep_search"
    return "use_known_fix" if state.get("known_fix") else "deep_search"
