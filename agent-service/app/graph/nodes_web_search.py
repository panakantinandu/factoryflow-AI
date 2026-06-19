"""
Tavily web search node — only reached on the low-confidence branch after
retrieve_manual + search_incidents didn't yield enough signal. Scoped to
manufacturer documentation and technical references for the specific machine
type + alarm code, not a generic web search.
"""

from tavily import TavilyClient

from app.core.config import settings
from app.graph.state import AgentState, log_step


def web_search(state: AgentState) -> dict:
    alarm_code = state.get("alarm_code") or "unknown alarm"
    machine_type = state.get("machine_type") or "industrial machine"

    query = f"{machine_type} alarm code {alarm_code} troubleshooting fix repair"

    try:
        client = TavilyClient(api_key=settings.tavily_api_key)
        response = client.search(query, max_results=3, search_depth="advanced")

        results = response.get("results", [])
        content = "\n\n".join(
            f"Source: {r.get('url', 'unknown')}\n{r.get('content', '')}"
            for r in results
        )

        web_search_result = {
            "query": query,
            "content": content,
            "num_results": len(results),
        }

        step = log_step(
            state,
            node_name="web_search",
            input_summary=f"Tavily search: {query}",
            output_summary=f"Retrieved {len(results)} web result(s) for external context",
            tool_called="tavily_search",
        )
    except Exception as exc:
        web_search_result = {"query": query, "content": "", "error": str(exc)}
        step = log_step(
            state,
            node_name="web_search",
            input_summary=f"Tavily search: {query}",
            output_summary=f"Web search failed: {exc} — proceeding without external context",
            tool_called="tavily_search",
        )

    return {
        "web_search_result": web_search_result,
        "reasoning_log": state["reasoning_log"] + [step],
    }
