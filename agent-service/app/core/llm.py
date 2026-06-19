"""
Featherless is OpenAI-API-compatible, so LangChain's ChatOpenAI works
directly by pointing base_url at Featherless and passing the Featherless
key as api_key. This is the officially documented integration pattern.

IMPORTANT: native tool/function calling on Featherless is only supported
by specific model families (check via check_model.py). If the model you
pick from check_model.py is NOT in a tool-calling-capable family, LangGraph's
.bind_tools() will likely fail or silently not call tools. In that case,
fall back to the prompted-JSON approach: describe the available tools in
the system prompt, ask the model to respond with a JSON object naming the
tool + arguments, and parse it manually instead of using .bind_tools().
This module exposes both paths so you can switch with one flag if your
chosen model doesn't support native tool calling.
"""

from langchain_openai import ChatOpenAI

from app.core.config import settings


def get_llm(temperature: float = 0.2) -> ChatOpenAI:
    """
    Returns a LangChain-compatible chat model pointed at Featherless.
    Use this everywhere instead of instantiating ChatOpenAI directly,
    so model/key changes happen in one place.
    """
    if not settings.featherless_api_key:
        raise RuntimeError(
            "FEATHERLESS_API_KEY not set. Copy .env.example to .env and fill it in."
        )
    if not settings.featherless_model:
        raise RuntimeError(
            "FEATHERLESS_MODEL not set. Run `python -m app.core.check_model` "
            "to see tool-capable models available on your plan, then set "
            "FEATHERLESS_MODEL in .env."
        )

    return ChatOpenAI(
        base_url=settings.featherless_base_url,
        api_key=settings.featherless_api_key,
        model=settings.featherless_model,
        temperature=temperature,
    )
