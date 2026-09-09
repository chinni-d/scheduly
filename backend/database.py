import os
import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import Optional
import asyncpg
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("POSTGRES_PRISMA_URL")

pool: Optional[asyncpg.Pool] = None


def parse_database_url(url: str):
    """
    Parses a PostgreSQL connection string (including Neon DB URLs)
    and configures SSL appropriately for asyncpg.
    """
    if not url:
        return None, None

    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]

    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)

    # asyncpg does not accept sslmode query parameter directly in DSN
    sslmode = query_params.pop("sslmode", [None])[0]
    query_params.pop("channel_binding", None)

    # Rebuild query string without sslmode
    new_query = urlencode(query_params, doseq=True)
    clean_dsn = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        new_query,
        parsed.fragment
    ))

    # Remote database connections (e.g. Neon) require SSL
    is_remote = parsed.hostname and (
        "neon.tech" in parsed.hostname or
        (parsed.hostname != "localhost" and parsed.hostname != "127.0.0.1")
    )
    if sslmode in ("require", "verify-ca", "verify-full") or is_remote:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ssl_config = ctx
    else:
        ssl_config = None

    return clean_dsn, ssl_config


async def init_db_pool():
    """Initializes the asyncpg connection pool and ensures the clean appointments table exists."""
    global pool
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("POSTGRES_PRISMA_URL")
    if not db_url:
        print("[WARNING] DATABASE_URL is not set.")
        return None

    clean_dsn, ssl_ctx = parse_database_url(db_url)
    try:
        pool = await asyncpg.create_pool(
            dsn=clean_dsn,
            ssl=ssl_ctx,
            min_size=1,
            max_size=5,
            timeout=15.0
        )
        print("[INFO] Connected successfully to database.")

        # Ensure clean appointments table exists (no mock data inserted)
        async with pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT DEFAULT '',
                    date DATE NOT NULL,
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (date);
            """)
        return pool
    except Exception as e:
        print(f"[ERROR] Failed to connect to database: {e}")
        pool = None
        return None


async def close_db_pool():
    """Closes the asyncpg connection pool."""
    global pool
    if pool:
        await pool.close()
        pool = None
        print("[INFO] Database connection pool closed.")


def get_pool() -> Optional[asyncpg.Pool]:
    """Returns the current connection pool."""
    return pool


async def get_or_init_pool() -> Optional[asyncpg.Pool]:
    """Returns the active pool, or initializes it on-demand for serverless environments."""
    global pool
    if pool is None or getattr(pool, '_closed', False):
        await init_db_pool()
    return pool

