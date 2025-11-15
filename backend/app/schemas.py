from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Generic, TypeVar
from .models import JobStatus

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: int
    
    class Config:
        from_attributes = True

class LogFileCreate(BaseModel):
    filename: str
    original_filename: str
    file_path: str
    file_size: int

class LogFileResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    log_file_id: int

class JobResponse(BaseModel):
    id: int
    log_file_id: int
    status: JobStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True

class RuleResponse(BaseModel):
    id: int
    job_id: int
    rule_xml: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RuleUpdate(BaseModel):
    rule_xml: str

