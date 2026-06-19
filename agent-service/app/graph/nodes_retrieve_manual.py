"""
Two-stage manual lookup node.

Stage 1: Exact match against manual_chunks.alarm_codes TEXT[] (GIN-indexed, fast).
Stage 2: Keyword/ILIKE fallback if no exact match — practical for demo since
         seeding real pgvector embeddings at event time is slow. Real prod would
         use pgvector similarity here instead.
"""

from sqlalchemy import text as sql_text

from app.core.database import get_db_session
from app.graph.state import AgentState, log_step


def retrieve_manual(state: AgentState) -> dict:
    alarm_code = state.get("alarm_code")

    if not alarm_code:
        step = log_step(
            state,
            node_name="retrieve_manual",
            input_summary="No alarm_code available — skipping manual lookup",
            output_summary="No lookup performed",
        )
        return {"manual_result": None, "reasoning_log": state["reasoning_log"] + [step]}

    machine_type = state.get("machine_type") or ""

    db = get_db_session()
    try:
        # Stage 1: exact alarm_codes array match (GIN index makes this O(1))
        row = db.execute(
            sql_text(
                """
                SELECT mc.id, mc.section_title, mc.content, m.title AS manual_title
                FROM manual_chunks mc
                JOIN manuals m ON mc.manual_id = m.id
                WHERE :alarm_code = ANY(mc.alarm_codes)
                LIMIT 1
                """
            ),
            {"alarm_code": alarm_code},
        ).fetchone()

        source = "exact_alarm_code_match"

        # Stage 2: keyword fallback if exact match missed
        if row is None:
            row = db.execute(
                sql_text(
                    """
                    SELECT mc.id, mc.section_title, mc.content, m.title AS manual_title
                    FROM manual_chunks mc
                    JOIN manuals m ON mc.manual_id = m.id
                    WHERE mc.content ILIKE :alarm_pattern
                       OR mc.content ILIKE :machine_pattern
                    ORDER BY mc.id
                    LIMIT 1
                    """
                ),
                {
                    "alarm_pattern": f"%{alarm_code}%",
                    "machine_pattern": f"%{machine_type}%",
                },
            ).fetchone()
            source = "keyword_fallback"
    finally:
        db.close()

    if row is None:
        step = log_step(
            state,
            node_name="retrieve_manual",
            input_summary=f"Searching manuals for alarm_code={alarm_code}",
            output_summary="No matching manual section found — will rely on incident history and web search",
            tool_called="retrieve_manual",
        )
        return {"manual_result": None, "reasoning_log": state["reasoning_log"] + [step]}

    manual_result = {
        "manual_title": row.manual_title,
        "section_title": row.section_title,
        "content": row.content,
        "source": source,
    }

    step = log_step(
        state,
        node_name="retrieve_manual",
        input_summary=f"Searching manuals for alarm_code={alarm_code}",
        output_summary=f"Found '{row.section_title}' in {row.manual_title} (via {source})",
        tool_called="retrieve_manual",
    )

    return {"manual_result": manual_result, "reasoning_log": state["reasoning_log"] + [step]}
