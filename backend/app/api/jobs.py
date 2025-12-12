from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
import logging
import math

from ..db import get_db, SessionLocal
from ..models import Job, LogFile, Rule, JobStatus
from ..schemas import JobCreate, JobResponse, PaginatedResponse
from ..utils.job_processor import process_job_with_retry
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# Get limiter from app state for rate limiting
def get_limiter(request: Request):
    return request.app.state.limiter

def process_job_background(job_id: int, log_file_id: int, rule_id: int = None):
    """Background task to process job with retry and timeout"""
    db = SessionLocal()
    try:
        logger.info(f"Starting background processing for job {job_id}" + (f" with rule_id {rule_id}" if rule_id else ""))
        process_job_with_retry(job_id, log_file_id, db, rule_id=rule_id)
    except Exception as e:
        logger.error(f"Unexpected error in background task for job {job_id}: {str(e)}", exc_info=True)
    finally:
        db.close()

@router.post("/generate", response_model=JobResponse, status_code=201)
async def create_generation_job(
    request: Request,
    job_data: JobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new job to generate Wazuh rule from log file - Rate limited to 20/minute"""
    # Rate limiting check
    limiter = get_limiter(request)
    @limiter.limit("20/minute")
    async def _rate_check(request: Request):
        pass
    await _rate_check(request)
    
    # Verify log file exists
    log_file = db.query(LogFile).filter(LogFile.id == job_data.log_file_id).first()
    if not log_file:
        raise HTTPException(status_code=404, detail="Log file not found")
    
    # Validate rule_id if provided (must be in custom range 100000-120000)
    if job_data.rule_id is not None:
        if not (100000 <= job_data.rule_id < 120000):
            raise HTTPException(
                status_code=400,
                detail="Rule ID must be between 100000 and 119999 for custom rules"
            )
    
    # Create job
    job = Job(
        log_file_id=job_data.log_file_id,
        status=JobStatus.PENDING,
        rule_id=job_data.rule_id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Invalidate cache when new job is created
    from ..utils.cache import cache
    cache.delete("job_count")
    
    # Start background task (pass rule_id if available)
    background_tasks.add_task(process_job_background, job.id, job_data.log_file_id, job_data.rule_id)
    
    return job

@router.get("", response_model=PaginatedResponse[JobResponse])
async def list_jobs(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """List jobs with pagination"""
    from ..utils.cache import cache
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Cache total count for 10 seconds (jobs change frequently)
    cache_key = "job_count"
    total = cache.get(cache_key)
    if total is None:
        total = db.query(Job).count()
        cache.set(cache_key, total, ttl=10)
    
    # Get paginated jobs with eager loading to avoid N+1 queries
    jobs = (
        db.query(Job)
        .options(joinedload(Job.log_file), joinedload(Job.rule))
        .order_by(Job.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Calculate total pages
    total_pages = math.ceil(total / limit) if total > 0 else 0
    
    return {
        "items": jobs,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific job with related data"""
    job = (
        db.query(Job)
        .options(joinedload(Job.log_file), joinedload(Job.rule))
        .filter(Job.id == job_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

