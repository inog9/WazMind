"""Job processor with retry mechanism and timeout"""
import time
import logging
import threading
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from ..models import Job, LogFile, Rule, JobStatus
from ..services.groq_client import GroqClient
from ..utils.file import read_log_sample
from ..utils.validator import validate_xml_rule

logger = logging.getLogger(__name__)

# Configuration
MAX_RETRIES = 3
JOB_TIMEOUT_SECONDS = 300  # 5 minutes
RETRY_DELAY_SECONDS = 5  # Wait 5 seconds before retry


class TimeoutError(Exception):
    """Custom timeout error"""
    pass


def process_job_with_retry(job_id: int, log_file_id: int, db: Session, retry_count: int = 0):
    """Process job with retry mechanism and timeout"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        logger.warning(f"Job {job_id} not found")
        return False
    
    # Check timeout
    if job.started_at:
        elapsed = (datetime.utcnow() - job.started_at).total_seconds()
        if elapsed > JOB_TIMEOUT_SECONDS:
            logger.error(f"Job {job_id} exceeded timeout ({JOB_TIMEOUT_SECONDS}s)")
            job.status = JobStatus.FAILED
            job.error_message = f"Job timeout after {JOB_TIMEOUT_SECONDS} seconds"
            db.commit()
            return False
    
    # Record start time for timeout checking
    start_time = datetime.utcnow()
    
    try:
        # Mark job as processing
        if job.status != JobStatus.PROCESSING:
            job.status = JobStatus.PROCESSING
            job.started_at = datetime.utcnow()
            job.retry_count = retry_count
            db.commit()
            db.refresh(job)
            logger.info(f"Job {job_id} started processing (retry {retry_count})")
        
        # Check timeout before each major operation
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        if elapsed > JOB_TIMEOUT_SECONDS:
            raise TimeoutError(f"Job timeout after {JOB_TIMEOUT_SECONDS} seconds")
        
        # Get log file
        log_file = db.query(LogFile).filter(LogFile.id == log_file_id).first()
        if not log_file:
            raise ValueError(f"Log file {log_file_id} not found")
        
        # Check timeout
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        if elapsed > JOB_TIMEOUT_SECONDS:
            raise TimeoutError(f"Job timeout after {JOB_TIMEOUT_SECONDS} seconds")
        
        # Read log sample (with path validation)
        import os
        upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
        if not os.path.isabs(upload_dir):
            upload_dir = os.path.abspath(upload_dir)
        
        sample_lines = read_log_sample(log_file.file_path, allowed_base_dir=upload_dir)
        if not sample_lines:
            raise ValueError("Log file is empty or could not be read")
        logger.info(f"Read {len(sample_lines)} sample lines from log file")
        
        # Check timeout
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        if elapsed > JOB_TIMEOUT_SECONDS:
            raise TimeoutError(f"Job timeout after {JOB_TIMEOUT_SECONDS} seconds")
        
        # Generate rule
        groq_client = GroqClient()
        rule_xml = groq_client.generate_wazuh_rule(sample_lines)
        logger.info(f"Rule generated successfully for job {job_id}")
        
        # Check timeout
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        if elapsed > JOB_TIMEOUT_SECONDS:
            raise TimeoutError(f"Job timeout after {JOB_TIMEOUT_SECONDS} seconds")
        
        # Validate rule and get sanitized version
        is_valid, error, sanitized_xml = validate_xml_rule(rule_xml)
        if not is_valid:
            from ..utils.sanitizer import sanitize_error_message
            raise ValueError(f"Rule validation failed: {sanitize_error_message(error)}")
        
        # Save rule with sanitized XML
        rule = Rule(
            job_id=job_id,
            rule_xml=sanitized_xml
        )
        db.add(rule)
        
        # Mark as completed
        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()
        db.commit()
        
        # Invalidate cache when job status changes
        from ..utils.cache import cache
        cache.delete("job_count")
        
        logger.info(f"Job {job_id} completed successfully")
        return True
        
    except TimeoutError as e:
        logger.error(f"Job {job_id} timed out: {str(e)}")
        job.status = JobStatus.FAILED
        job.error_message = f"Job timeout after {JOB_TIMEOUT_SECONDS} seconds"
        db.commit()
        
        # Invalidate cache when job status changes
        from ..utils.cache import cache
        cache.delete("job_count")
        
        return False
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error processing job {job_id} (retry {retry_count}): {error_msg}", exc_info=True)
        
        # Sanitize error message before storing
        from ..utils.sanitizer import sanitize_error_message
        sanitized_error = sanitize_error_message(error_msg)
        
        # Check if we should retry
        if retry_count < MAX_RETRIES:
            logger.info(f"Retrying job {job_id} in {RETRY_DELAY_SECONDS} seconds (attempt {retry_count + 1}/{MAX_RETRIES})")
            time.sleep(RETRY_DELAY_SECONDS)
            return process_job_with_retry(job_id, log_file_id, db, retry_count + 1)
        else:
            # Max retries reached
            job.status = JobStatus.FAILED
            job.error_message = f"Failed after {MAX_RETRIES} retries: {sanitized_error}"
            db.commit()
            
            # Invalidate cache when job status changes
            from ..utils.cache import cache
            cache.delete("job_count")
            
            logger.error(f"Job {job_id} failed after {MAX_RETRIES} retries")
            return False

