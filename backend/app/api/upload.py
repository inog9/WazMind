from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Response
from sqlalchemy.orm import Session, joinedload
from typing import List
import os
import logging

from ..db import get_db
from ..models import LogFile, Job
from ..schemas import LogFileResponse
from ..utils.file import save_uploaded_file, delete_file
from ..utils.validator import validate_file_size, validate_file_extension

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Get upload directory - default to ./uploads for manual development
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
# Ensure absolute path
if not os.path.isabs(UPLOAD_DIR):
    UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

@router.post("", response_model=LogFileResponse, status_code=201)
async def upload_log_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a log file for analysis"""
    
    logger.info(f"Received upload request for file: {file.filename}")
    
    # Validate file extension
    is_valid, error = validate_file_extension(file.filename)
    if not is_valid:
        logger.warning(f"Invalid file extension for {file.filename}: {error}")
        raise HTTPException(status_code=400, detail=error)
    
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
        raise HTTPException(status_code=400, detail=error)
    
    file_path = None
    try:
        # Save file
        file_path, unique_filename = save_uploaded_file(
            content, file.filename, UPLOAD_DIR
        )
        logger.info(f"File saved to {file_path}")
        
        # Save to database
        db_log_file = LogFile(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=file_size
        )
        db.add(db_log_file)
        db.commit()
        db.refresh(db_log_file)
        
        logger.info(f"File uploaded successfully with ID: {db_log_file.id}")
        return db_log_file
    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {str(e)}", exc_info=True)
        # Clean up file if database save fails
        if file_path:
            try:
                delete_file(file_path)
                logger.info(f"Cleaned up file: {file_path}")
            except Exception as cleanup_error:
                logger.error(f"Error cleaning up file: {str(cleanup_error)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("", response_model=List[LogFileResponse])
async def list_uploaded_files(db: Session = Depends(get_db)):
    """List all uploaded log files with optimized query"""
    files = (
        db.query(LogFile)
        .options(joinedload(LogFile.jobs))
        .order_by(LogFile.uploaded_at.desc())
        .all()
    )
    return files

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
    log_file = db.query(LogFile).filter(LogFile.id == file_id).first()
    if not log_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        from ..utils.file import read_log_sample
        lines = read_log_sample(log_file.file_path, max_lines=max_lines)
        return {"lines": lines, "total_lines": len(lines)}
    except Exception as e:
        logger.error(f"Error reading file sample: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")


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

    # Remove physical file
    if log_file.file_path:
        try:
            if delete_file(log_file.file_path):
                logger.info(f"Deleted file from disk: {log_file.file_path}")
            else:
                logger.warning(f"File not found on disk: {log_file.file_path}")
        except Exception as e:
            logger.error(f"Error deleting file from disk: {str(e)}")

    db.delete(log_file)
    db.commit()

    return Response(status_code=204)

