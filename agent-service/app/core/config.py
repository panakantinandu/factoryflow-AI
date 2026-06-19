from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/factoryflow"

    featherless_api_key: str = ""
    featherless_base_url: str = "https://api.featherless.ai/v1"

    # IMPORTANT: Featherless's catalogue is huge (3,000+ models), and native
    # tool/function calling is only supported on specific model families —
    # not every model. Before the event, run:
    #   python -m app.core.check_model
    # which hits GET /v1/models?capabilities=chat,tool-use against your
    # actual API key and prints currently-available tool-capable models.
    # Pick one from that live list and set it here — don't hardcode a name
    # from documentation, since the catalogue changes.
    featherless_model: str = ""  # fill after running check_model.py

    tavily_api_key: str = ""
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
