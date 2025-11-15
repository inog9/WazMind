from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .db import engine, Base
from .api import upload, jobs, rules
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
# Try to load from root directory first, then from backend directory
root_dir = Path(__file__).parent.parent.parent
env_paths = [
    root_dir / ".env",  # Root directory
    Path(__file__).parent.parent / ".env",  # Backend directory
]
env_loaded = False
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"Loaded environment variables from {env_path}")
        env_loaded = True
        break

if not env_loaded:
    # If no .env found, try default behavior
    load_dotenv()
    logger.warning("No .env file found, using default environment variables")

# Create database tables
Base.metadata.create_all(bind=engine)

# Run migration to add new columns if needed
try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(backend_dir))
    from migrate_db import migrate_db
    migrate_db()
except Exception as e:
    logger.warning(f"Migration check failed (this is OK if columns already exist): {str(e)}")

app = FastAPI(
    title="WazMind API",
    description="AI-powered log intelligence for automated Wazuh rule generation",
    version="1.0.0"
)

# Rate limiting - using in-memory storage for simplicity
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://", default_limits=["1000/hour"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression for responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://api.groq.com; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        # XSS Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Include routers
app.include_router(upload.router)
app.include_router(jobs.router)
app.include_router(rules.router)

@app.get("/")
async def root():
    return {
        "message": "WazMind API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    """Health check endpoint with database connectivity test"""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "database": "disconnected",
                "error": str(e)
            }
        )

