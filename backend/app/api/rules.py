from fastapi import APIRouter, HTTPException, Depends, Response, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel
import zipfile
import io
from fastapi.responses import StreamingResponse
import math

from ..db import get_db
from ..models import Rule, Job
from ..schemas import RuleResponse, RuleUpdate, PaginatedResponse
from ..utils.validator import validate_xml_rule
from datetime import datetime

router = APIRouter(prefix="/api/rules", tags=["rules"])

class BulkDeleteRequest(BaseModel):
    rule_ids: List[int]

@router.get("", response_model=PaginatedResponse[RuleResponse])
async def list_rules(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """List generated rules with pagination"""
    from ..utils.cache import cache
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Cache total count for 30 seconds
    cache_key = "rule_count"
    total = cache.get(cache_key)
    if total is None:
        total = db.query(Rule).count()
        cache.set(cache_key, total, ttl=30)
    
    # Get paginated rules
    rules = (
        db.query(Rule)
        .options(joinedload(Rule.job))
        .order_by(Rule.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Calculate total pages
    total_pages = math.ceil(total / limit) if total > 0 else 0
    
    return {
        "items": rules,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: int, db: Session = Depends(get_db)):
    """Get a specific rule with related job data"""
    rule = (
        db.query(Rule)
        .options(joinedload(Rule.job))
        .filter(Rule.id == rule_id)
        .first()
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.get("/job/{job_id}", response_model=RuleResponse)
async def get_rule_by_job(job_id: int, db: Session = Depends(get_db)):
    """Get rule by job ID with optimized query"""
    rule = (
        db.query(Rule)
        .options(joinedload(Rule.job))
        .filter(Rule.job_id == job_id)
        .first()
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found for this job")
    return rule

@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: int,
    rule_update: RuleUpdate,
    db: Session = Depends(get_db)
):
    """Update a rule's XML"""
    
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # Validate XML and get sanitized version
    is_valid, error, sanitized_xml = validate_xml_rule(rule_update.rule_xml)
    if not is_valid:
        from ..utils.sanitizer import sanitize_error_message
        raise HTTPException(status_code=400, detail=sanitize_error_message(error))
    
    # Update rule with sanitized XML
    rule.rule_xml = sanitized_xml
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    
    # Invalidate cache (rule count might change if this affects listing)
    from ..utils.cache import cache
    cache.delete("rule_count")
    
    return rule

@router.post("/bulk-delete", status_code=200)
async def bulk_delete_rules(request: BulkDeleteRequest, db: Session = Depends(get_db)):
    """Bulk delete multiple rules"""
    from ..utils.sanitizer import sanitize_list_of_ids
    
    # Validate and sanitize rule IDs
    is_valid, error, sanitized_ids = sanitize_list_of_ids(request.rule_ids)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    deleted_count = 0
    errors = []
    
    for rule_id in sanitized_ids:
        try:
            rule = db.query(Rule).filter(Rule.id == rule_id).first()
            if not rule:
                errors.append(f"Rule {rule_id} not found")
                continue
            
            db.delete(rule)
            deleted_count += 1
        except Exception as e:
            errors.append(f"Error deleting rule {rule_id}: {str(e)}")
    
    db.commit()
    
    # Invalidate cache when rules are deleted
    from ..utils.cache import cache
    cache.delete("rule_count")
    
    return {
        "deleted_count": deleted_count,
        "total_requested": len(sanitized_ids),
        "errors": errors
    }

@router.get("/bulk-export")
async def bulk_export_rules(rule_ids: List[int] = Query(...), db: Session = Depends(get_db)):
    """Export multiple rules as ZIP file"""
    from ..utils.sanitizer import sanitize_list_of_ids
    
    # Validate and sanitize rule IDs
    is_valid, error, sanitized_ids = sanitize_list_of_ids(rule_ids)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Use parameterized query with IN clause (SQLAlchemy handles this safely)
    rules = db.query(Rule).filter(Rule.id.in_(sanitized_ids)).all()
    
    if not rules:
        raise HTTPException(status_code=404, detail="No rules found")
    
    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for rule in rules:
            filename = f"wazuh_rule_{rule.id}.xml"
            zip_file.writestr(filename, rule.rule_xml)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(zip_buffer.read()),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=wazuh_rules_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.zip"
        }
    )

@router.delete("/{rule_id}", status_code=204)
async def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete a rule"""
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    return None

