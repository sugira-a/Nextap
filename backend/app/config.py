import os
from datetime import timedelta
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

# Triggered rebuild - pg8000 driver now ensured in requirements
def _resolve_database_url() -> str:
    """Resolve the database URL from common deployment environment variables."""
    database_url = (
        os.getenv('DATABASE_URL')
        or os.getenv('DATABASE_URL_UNPOOLED')
        or os.getenv('POSTGRES_URL')
        or os.getenv('POSTGRES_URL_NON_POOLING')
        or os.getenv('POSTGRES_URL_NO_SSL')
    )

    if not database_url:
        if os.getenv('FLASK_ENV', '').strip().lower() == 'production':
            raise RuntimeError('DATABASE_URL (or compatible POSTGRES_* URL) is required in production')
        database_url = 'sqlite:///nextap_dev.db'

    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql+pg8000://', 1)

    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+pg8000://', 1)

    if database_url.startswith('postgresql+psycopg://'):
        database_url = database_url.replace('postgresql+psycopg://', 'postgresql+pg8000://', 1)

    if database_url.startswith('postgresql+psycopg2://'):
        database_url = database_url.replace('postgresql+psycopg2://', 'postgresql+pg8000://', 1)

    if database_url.startswith('postgresql+pg8000://'):
        parsed = urlparse(database_url)
        query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
        unsupported_keys = {'sslmode', 'channel_binding'}
        normalized_query = [
            (key, value)
            for key, value in query_pairs
            if key.lower() not in unsupported_keys
        ]
        database_url = urlunparse(parsed._replace(query=urlencode(normalized_query)))

    return database_url

class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database
    # Uses PostgreSQL if a database URL is provided, otherwise SQLite for development
    SQLALCHEMY_DATABASE_URI = _resolve_database_url()
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8080,http://localhost:8081,http://localhost:3000').split(',')
    
    # App settings
    JSON_SORT_KEYS = False
    PROPAGATE_EXCEPTIONS = True


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
