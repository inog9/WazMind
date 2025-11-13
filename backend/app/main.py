from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base
from .api import upload, jobs, rules
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

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

app = FastAPI(
    title="WazMind API",
    description="AI-powered log intelligence for automated Wazuh rule generation",
    version="1.0.0"
)

# CORS configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"status": "healthy"}

