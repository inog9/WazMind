from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
import logging

from ..db import get_db, SessionLocal
from ..models import Job, LogFile, Rule, JobStatus
from ..schemas import JobCreate, JobResponse
from ..services.groq_client import GroqClient
from ..utils.file import read_log_sample
from ..utils.validator import validate_xml_rule
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

def process_job_background(job_id: int, log_file_id: int):
    """Background task to process job and generate rule"""
    db = SessionLocal()
    job = None
    try:
        logger.info(f"Processing job {job_id} for log file {log_file_id}")
        
        # Update job status - use single query with refresh
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            logger.warning(f"Job {job_id} not found")
            return
        
        job.status = JobStatus.PROCESSING
        db.commit()
        db.refresh(job)
        logger.info(f"Job {job_id} status updated to PROCESSING")
        
        # Get log file - use single query
        log_file = db.query(LogFile).filter(LogFile.id == log_file_id).first()
        if not log_file:
            logger.error(f"Log file {log_file_id} not found for job {job_id}")
            job.status = JobStatus.FAILED
            job.error_message = "Log file not found"
            db.commit()
            return
        
        # Read log sample
        try:
            sample_lines = read_log_sample(log_file.file_path)
            if not sample_lines:
                logger.error(f"Log file {log_file_id} is empty or could not be read")
                job.status = JobStatus.FAILED
                job.error_message = "Log file is empty or could not be read"
                db.commit()
                return
            logger.info(f"Read {len(sample_lines)} sample lines from log file")
        except Exception as e:
            logger.error(f"Error reading log file {log_file_id}: {str(e)}")
            job.status = JobStatus.FAILED
            job.error_message = f"Error reading log file: {str(e)}"
            db.commit()
            return
        
        # Generate rule using AI client
        try:
            groq_client = GroqClient()
            rule_xml = groq_client.generate_wazuh_rule(sample_lines)
            logger.info(f"Rule generated successfully for job {job_id}")
        except Exception as e:
            logger.error(f"Error generating rule for job {job_id}: {str(e)}")
            job.status = JobStatus.FAILED
            job.error_message = f"Error generating rule: {str(e)}"
            db.commit()
            return
        
        # Validate rule XML
        is_valid, error = validate_xml_rule(rule_xml)
        if not is_valid:
            logger.error(f"Generated rule validation failed for job {job_id}: {error}")
            job.status = JobStatus.FAILED
            job.error_message = f"Generated rule validation failed: {error}"
            db.commit()
            return
        
        # Save rule
        rule = Rule(
            job_id=job_id,
            rule_xml=rule_xml
        )
        db.add(rule)
        
        # Update job status
        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()
        db.commit()
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Unexpected error processing job {job_id}: {str(e)}", exc_info=True)
        # Update job with error
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = JobStatus.FAILED
                job.error_message = f"Unexpected error: {str(e)}"
                db.commit()
        except Exception as db_error:
            logger.error(f"Error updating job status: {str(db_error)}")
    finally:
        db.close()

@router.post("/generate", response_model=JobResponse, status_code=201)
async def create_generation_job(
    job_data: JobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new job to generate Wazuh rule from log file"""
    
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

