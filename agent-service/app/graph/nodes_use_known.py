"""
Fast-path node. Formats an existing resolved_knowledge entry into the
same diagnosis shape generate_diagnosis would produce, so downstream
nodes (generate_report, generate_handoff) don't need to know which path
was taken. This is also where times_reused gets incremented — done here
rather than at the very end so the count is correct even if scaffolding
isn't built far enough yet to reach persist_knowledge.
"""

from sqlalchemy import text as sql_text

from app.core.database import get_db_session
from app.graph.state import AgentState, log_step


def use_known_fix(state: AgentState) -> dict:
    known_fix = state["known_fix"]

    diagnosis = {
        "probable_cause": known_fix["distilled_cause"],
        "recommended_fix": known_fix["distilled_fix"],
        "confidence_score": 0.95,  # validated prior fix, high confidence by definition
        "source": "known_resolution",
        "times_previously_resolved": known_fix["times_reused"],
    }

    db = get_db_session()
    try:
        db.execute(
            sql_text(
                """
                UPDATE resolved_knowledge
                SET times_reused = times_reused + 1, last_used_at = now()
                WHERE id = :id
                """
            ),
            {"id": known_fix["id"]},
        )
        db.commit()
    finally:
        db.close()

    step = log_step(
        state,
        node_name="use_known_fix",
        input_summary=f"Applying validated fix (used {known_fix['times_reused']} times before)",
        output_summary=f"This fix has now resolved this alarm "
        f"{known_fix['times_reused'] + 1} time(s) — fast path taken",
    )

    return {
        "diagnosis": diagnosis,
        "confidence_score": 0.95,
        "reasoning_log": state["reasoning_log"] + [step],
    }
