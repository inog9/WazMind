from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from sqlalchemy.orm import Session, joinedload
from typing import List
import logging

from ..db import get_db, SessionLocal
from ..models import Job, LogFile, Rule, JobStatus
from ..schemas import JobCreate, JobResponse
from ..utils.job_processor import process_job_with_retry
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# Get limiter from app state for rate limiting
def get_limiter(request: Request):
    return request.app.state.limiter

def process_job_background(job_id: int, log_file_id: int):
    """Background task to process job with retry and timeout"""
    db = SessionLocal()
    try:
        logger.info(f"Starting background processing for job {job_id}")
        process_job_with_retry(job_id, log_file_id, db)
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
    
    # Create job
    job = Job(
        log_file_id=job_data.log_file_id,
        status=JobStatus.PENDING
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Start background task
    background_tasks.add_task(process_job_background, job.id, job_data.log_file_id)
    
    return job

@router.get("", response_model=List[JobResponse])
async def list_jobs(db: Session = Depends(get_db)):
    """List all jobs with optimized query"""
    # Use eager loading to avoid N+1 queries
    jobs = (
        db.query(Job)
        .options(joinedload(Job.log_file), joinedload(Job.rule))
        .order_by(Job.created_at.desc())
        .all()
    )
    return jobs

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

