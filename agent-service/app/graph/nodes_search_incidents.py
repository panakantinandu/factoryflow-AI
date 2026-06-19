"""
Queries incident history for prior resolved occurrences of this alarm_code.
Returns up to 5 most recent resolved incidents, ordered newest-first.
This data becomes context for generate_diagnosis — the more prior incidents
with consistent resolution, the higher confidence the diagnosis can assert.
"""

from sqlalchemy import text as sql_text

from app.core.database import get_db_session
from app.graph.state import AgentState, log_step


def search_incidents(state: AgentState) -> dict:
    alarm_code = state.get("alarm_code")

    if not alarm_code:
        step = log_step(
            state,
            node_name="search_incidents",
            input_summary="No alarm_code available — skipping incident history lookup",
            output_summary="No lookup performed",
        )
        return {"incident_results": [], "reasoning_log": state["reasoning_log"] + [step]}

    db = get_db_session()
    try:
        rows = db.execute(
            sql_text(
                """
                SELECT i.alarm_code, i.probable_cause, i.recommended_fix,
                       i.confidence_score, i.resolution_status,
                       m.machine_type, i.created_at
                FROM incidents i
                LEFT JOIN machines m ON i.machine_id = m.id
                WHERE i.alarm_code = :alarm_code
                  AND i.resolution_status = 'resolved'
                ORDER BY i.created_at DESC
                LIMIT 5
                """
            ),
            {"alarm_code": alarm_code},
        ).fetchall()
    finally:
        db.close()

    incident_results = [
        {
            "alarm_code": r.alarm_code,
            "probable_cause": r.probable_cause,
            "recommended_fix": r.recommended_fix,
            "confidence_score": r.confidence_score,
            "machine_type": r.machine_type,
        }
        for r in rows
    ]

    step = log_step(
        state,
        node_name="search_incidents",
        input_summary=f"Querying incident history for alarm_code={alarm_code}",
        output_summary=f"Found {len(incident_results)} prior resolved incident(s)",
        tool_called="search_incidents",
    )

    return {
        "incident_results": incident_results,
        "reasoning_log": state["reasoning_log"] + [step],
    }
