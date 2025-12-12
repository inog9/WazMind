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
    rule_id: Optional[int] = None  # Optional custom rule ID (100000-120000)

class JobResponse(BaseModel):
    id: int
    log_file_id: int
    status: JobStatus
    rule_id: Optional[int] = None
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

class WazuhRuleResponse(BaseModel):
    id: int
    rule_id: int
    level: int
    description: Optional[str] = None
    groups: Optional[str] = None
    source: str
    file_path: str
    file_name: str
    file_mtime: Optional[datetime] = None
    is_overwritten: int
    rule_xml: Optional[str] = None
    scanned_at: datetime
    parent_rule_ids: Optional[str] = None
    child_rule_ids: Optional[str] = None
    
    class Config:
        from_attributes = True

