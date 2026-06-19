"""
Run this BEFORE the event, once you have your Featherless API key:

    cd agent-service
    python -m app.core.check_model

It hits the live /v1/models endpoint filtered to tool-capable chat models
and prints the results, so you pick a model that's actually available on
your plan right now — not one that looked right in a doc that may be stale.

Pick whichever balances size (quality) against your latency tolerance for
a live demo, then paste it into agent-service/.env as FEATHERLESS_MODEL.
"""

import httpx
from app.core.config import settings


def main():
    if not settings.featherless_api_key:
        print("FEATHERLESS_API_KEY is not set in .env — set it first.")
        return

    url = f"{settings.featherless_base_url}/models"
    params = {"capabilities": "chat,tool-use", "available_on_current_plan": "true"}
    headers = {"Authorization": f"Bearer {settings.featherless_api_key}"}

    resp = httpx.get(url, params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    models = data.get("data", [])
    if not models:
        print("No tool-capable models returned for your current plan.")
        print("Try dropping 'available_on_current_plan=true' to see the full catalogue,")
        print("or check your plan tier on the Featherless dashboard.")
        return

    print(f"Found {len(models)} tool-capable model(s) on your plan:\n")
    for m in models:
        print(f"  {m['id']}")
        print(f"    context_length: {m.get('context_length')}")
        print(f"    max_completion_tokens: {m.get('max_completion_tokens')}")
        print()

    print("Copy one of the IDs above into agent-service/.env as FEATHERLESS_MODEL")


if __name__ == "__main__":
    main()
