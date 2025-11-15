from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Response, Request, Body, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel
import os
import logging
import math

from ..db import get_db
from ..models import LogFile, Job
from ..schemas import LogFileResponse, PaginatedResponse
from ..utils.file import save_uploaded_file, delete_file
from ..utils.validator import validate_file_size, validate_file_extension

class BulkDeleteRequest(BaseModel):
    file_ids: List[int]

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Get limiter from app state for rate limiting
def get_limiter(request: Request):
    return request.app.state.limiter

# Get upload directory - default to ./uploads for manual development
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
# Ensure absolute path
if not os.path.isabs(UPLOAD_DIR):
    UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

@router.post("", response_model=LogFileResponse, status_code=201)
async def upload_log_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a log file for analysis - Rate limited to 10/minute"""
    # Rate limiting check
    limiter = get_limiter(request)
    @limiter.limit("10/minute")
    async def _rate_check(request: Request):
        pass
    await _rate_check(request)
    
    logger.info(f"Received upload request for file: {file.filename}")
    
    # Validate file extension and sanitize filename
    is_valid, error, sanitized_filename = validate_file_extension(file.filename)
    if not is_valid:
        logger.warning(f"Invalid file extension for {file.filename}: {error}")
        from ..utils.sanitizer import sanitize_error_message
        raise HTTPException(status_code=400, detail=sanitize_error_message(error))
    
    # Read file content
    try:
        content = await file.read()
        file_size = len(content)
        logger.info(f"File {file.filename} size: {file_size} bytes")
    except Exception as e:
        logger.error(f"Error reading file content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
    
    # Validate file size
    is_valid, error = validate_file_size(file_size, MAX_UPLOAD_SIZE_MB)
    if not is_valid:
        logger.warning(f"File size validation failed for {file.filename}: {error}")
        from ..utils.sanitizer import sanitize_error_message
        raise HTTPException(status_code=400, detail=sanitize_error_message(error))
    
    file_path = None
    try:
        # Save file (use sanitized filename)
        file_path, unique_filename = save_uploaded_file(
            content, sanitized_filename, UPLOAD_DIR
        )
        logger.info(f"File saved to {file_path}")
        
        # Save to database (store sanitized original filename)
        db_log_file = LogFile(
            filename=unique_filename,
            original_filename=sanitized_filename,
            file_path=file_path,
            file_size=file_size
        )
        db.add(db_log_file)
        db.commit()
        db.refresh(db_log_file)
        
        # Invalidate cache when new file is uploaded
        from ..utils.cache import cache
        cache.delete("logfile_count")
        
        logger.info(f"File uploaded successfully with ID: {db_log_file.id}")
        return db_log_file
    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {str(e)}", exc_info=True)
        # Clean up file if database save fails (with path validation)
        if file_path:
            try:
                delete_file(file_path, allowed_base_dir=UPLOAD_DIR)
                logger.info(f"Cleaned up file: {file_path}")
            except Exception as cleanup_error:
                logger.error(f"Error cleaning up file: {str(cleanup_error)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("", response_model=PaginatedResponse[LogFileResponse])
async def list_uploaded_files(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """List uploaded log files with pagination"""
    from ..utils.cache import cache
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Cache total count for 30 seconds (frequently accessed)
    cache_key = "logfile_count"
    total = cache.get(cache_key)
    if total is None:
        total = db.query(LogFile).count()
        cache.set(cache_key, total, ttl=30)
    
    # Get paginated files with optimized query
    files = (
        db.query(LogFile)
        .options(joinedload(LogFile.jobs))
        .order_by(LogFile.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Calculate total pages
    total_pages = math.ceil(total / limit) if total > 0 else 0
    
    return {
        "items": files,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/{file_id}", response_model=LogFileResponse)
async def get_uploaded_file(file_id: int, db: Session = Depends(get_db)):
    """Get a specific uploaded file"""
    file = db.query(LogFile).filter(LogFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@router.get("/{file_id}/sample")
async def get_file_sample(file_id: int, max_lines: int = 100, db: Session = Depends(get_db)):
    """Get sample lines from uploaded file for pattern detection"""
    # Validate max_lines to prevent DoS
    if max_lines < 1 or max_lines > 1000:
        max_lines = 100
    
    log_file = db.query(LogFile).filter(LogFile.id == file_id).first()
    if not log_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        from ..utils.file import read_log_sample
        # Validate file path before reading
        lines = read_log_sample(log_file.file_path, max_lines=max_lines, allowed_base_dir=UPLOAD_DIR)
        return {"lines": lines, "total_lines": len(lines)}
    except Exception as e:
        logger.error(f"Error reading file sample: {str(e)}")
        from ..utils.sanitizer import sanitize_error_message
        raise HTTPException(status_code=500, detail=sanitize_error_message(f"Error reading file: {str(e)}"))


@router.post("/bulk-delete", status_code=200)
async def bulk_delete_files(request: BulkDeleteRequest, db: Session = Depends(get_db)):
    """Bulk delete multiple files"""
    from ..utils.sanitizer import sanitize_list_of_ids
    
    # Validate and sanitize file IDs
    is_valid, error, sanitized_ids = sanitize_list_of_ids(request.file_ids)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    deleted_count = 0
    errors = []
    
    for file_id in sanitized_ids:
        try:
            log_file = (
                db.query(LogFile)
                .options(joinedload(LogFile.jobs).joinedload(Job.rule))
                .filter(LogFile.id == file_id)
                .first()
            )
            
            if not log_file:
                errors.append(f"File {file_id} not found")
                continue
            
            # Delete related jobs and rules
            for job in list(log_file.jobs):
                if job.rule:
                    db.delete(job.rule)
                db.delete(job)
            
            # Remove physical file (with path validation)
            if log_file.file_path:
                try:
                    delete_file(log_file.file_path, allowed_base_dir=UPLOAD_DIR)
                except Exception as e:
                    logger.warning(f"Error deleting file from disk: {str(e)}")
            
            db.delete(log_file)
            deleted_count += 1
        except Exception as e:
            errors.append(f"Error deleting file {file_id}: {str(e)}")
            logger.error(f"Error in bulk delete for file {file_id}: {str(e)}")
    
    db.commit()
    
    # Invalidate cache when files are deleted
    from ..utils.cache import cache
    cache.delete("logfile_count")
    
    return {
        "deleted_count": deleted_count,
        "total_requested": len(sanitized_ids),
        "errors": errors
    }

@router.delete("/{file_id}", status_code=204)
async def delete_uploaded_file(file_id: int, db: Session = Depends(get_db)):
    """Delete an uploaded file along with related jobs and rules"""
    log_file = (
        db.query(LogFile)
        .options(joinedload(LogFile.jobs).joinedload(Job.rule))
        .filter(LogFile.id == file_id)
        .first()
    )

    if not log_file:
        raise HTTPException(status_code=404, detail="File not found")

    logger.info(f"Deleting log file {log_file.id}: {log_file.original_filename}")

    # Delete related jobs and rules
    for job in list(log_file.jobs):
        if job.rule:
            logger.info(f"Deleting rule {job.rule.id} for job {job.id}")
            db.delete(job.rule)
        logger.info(f"Deleting job {job.id} for log file {log_file.id}")
        db.delete(job)

    # Remove physical file (with path validation)
    if log_file.file_path:
        try:
            if delete_file(log_file.file_path, allowed_base_dir=UPLOAD_DIR):
                logger.info(f"Deleted file from disk: {log_file.file_path}")
            else:
                logger.warning(f"File not found on disk: {log_file.file_path}")
        except Exception as e:
            logger.error(f"Error deleting file from disk: {str(e)}")

    db.delete(log_file)
    db.commit()
    
    # Invalidate cache when file is deleted
    from ..utils.cache import cache
    cache.delete("logfile_count")
    
    return Response(status_code=204)

