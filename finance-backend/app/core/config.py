from pydantic import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "PocketFlow API"
    API_VERSION: str = "1.0.0"

    FIREBASE_SERVICE_ACCOUNT_B64: str

    class Config:
        env_file = ".env"


settings = Settings()