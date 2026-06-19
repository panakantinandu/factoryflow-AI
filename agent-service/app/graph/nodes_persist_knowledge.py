"""
Closes the compounding-knowledge loop. If the deep-search path produced a
high-confidence diagnosis, upsert it into resolved_knowledge — so the NEXT
time this alarm fires on this machine type, search_known finds it and routes
straight to use_known_fix (the fast path). This is the step that makes the
second demo run visibly faster than the first.

Fast-path calls (use_known_fix) already increment times_reused in-place, so
we only run this node after a deep-search diagnosis.
"""

from sqlalchemy import text as sql_text

from app.core.database import get_db_session
from app.graph.state import AgentState, log_step

CONFIDENCE_THRESHOLD = 0.6


def persist_knowledge(state: AgentState) -> dict:
    alarm_code = state.get("alarm_code")
    machine_type = state.get("machine_type")
    diagnosis = state.get("diagnosis") or {}
    confidence_score = state.get("confidence_score", 0.0)

    # Skip: fast path already handled times_reused; or no alarm code parsed
    if not alarm_code or diagnosis.get("source") == "known_resolution":
        step = log_step(
            state,
            node_name="persist_knowledge",
            input_summary="Fast-path result or no alarm code — nothing new to persist",
            output_summary="Skipped",
        )
        return {"reasoning_log": state["reasoning_log"] + [step]}

    if confidence_score < CONFIDENCE_THRESHOLD:
        step = log_step(
            state,
            node_name="persist_knowledge",
            input_summary=f"Confidence {confidence_score:.0%} below {CONFIDENCE_THRESHOLD:.0%} threshold",
            output_summary="Diagnosis not confident enough to save as validated known fix",
        )
        return {"reasoning_log": state["reasoning_log"] + [step]}

    db = get_db_session()
    try:
        existing = db.execute(
            sql_text(
                """
                SELECT id FROM resolved_knowledge
                WHERE alarm_code = :alarm_code
                  AND (:machine_type IS NULL OR machine_type = :machine_type)
                LIMIT 1
                """
            ),
            {"alarm_code": alarm_code, "machine_type": machine_type},
        ).fetchone()

        if existing:
            db.execute(
                sql_text(
                    """
                    UPDATE resolved_knowledge
                    SET distilled_cause = :cause,
                        distilled_fix   = :fix,
                        times_reused    = times_reused + 1,
                        last_used_at    = now()
                    WHERE id = :id
                    """
                ),
                {
                    "cause": diagnosis.get("probable_cause", ""),
                    "fix": diagnosis.get("recommended_fix", ""),
                    "id": existing.id,
                },
            )
            action = "updated existing entry — times_reused incremented"
        else:
            db.execute(
                sql_text(
                    """
                    INSERT INTO resolved_knowledge
                        (alarm_code, machine_type, distilled_cause, distilled_fix, times_reused, last_used_at)
                    VALUES
                        (:alarm_code, :machine_type, :cause, :fix, 1, now())
                    """
                ),
                {
                    "alarm_code": alarm_code,
                    "machine_type": machine_type,
                    "cause": diagnosis.get("probable_cause", ""),
                    "fix": diagnosis.get("recommended_fix", ""),
                },
            )
            action = "new entry created — next occurrence uses fast path"

        db.commit()
    finally:
        db.close()

    step = log_step(
        state,
        node_name="persist_knowledge",
        input_summary=f"Saving diagnosis for {alarm_code} (confidence {confidence_score:.0%})",
        output_summary=f"Knowledge persisted: {action}",
        tool_called="persist_knowledge",
    )

    return {"reasoning_log": state["reasoning_log"] + [step]}
