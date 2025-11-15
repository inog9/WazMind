from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .db import Base

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class LogFile(Base):
    __tablename__ = "log_files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)  # Indexed for sorting
    
    jobs = relationship("Job", back_populates="log_file")
    
    # Composite index for common query patterns
    __table_args__ = (
        Index('idx_logfile_uploaded_at', 'uploaded_at'),
    )

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    log_file_id = Column(Integer, ForeignKey("log_files.id"), nullable=False, index=True)  # Indexed for joins
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING, index=True)  # Indexed for filtering
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Indexed for sorting
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)  # Track retry attempts
    started_at = Column(DateTime, nullable=True)  # Track when processing started
    
    log_file = relationship("LogFile", back_populates="jobs")
    rule = relationship("Rule", back_populates="job", uselist=False)
    
    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_job_status_created', 'status', 'created_at'),
        Index('idx_job_logfile_status', 'log_file_id', 'status'),
    )

class Rule(Base):
    __tablename__ = "rules"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, unique=True, index=True)  # Indexed for joins
    rule_xml = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Indexed for sorting
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    job = relationship("Job", back_populates="rule")
    
    # Composite index for common query patterns
    __table_args__ = (
        Index('idx_rule_created_at', 'created_at'),
    )

