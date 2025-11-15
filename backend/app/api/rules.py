from fastapi import APIRouter, HTTPException, Depends, Response, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel
import zipfile
import io
from fastapi.responses import StreamingResponse

from ..db import get_db
from ..models import Rule, Job
from ..schemas import RuleResponse, RuleUpdate
from ..utils.validator import validate_xml_rule
from datetime import datetime

router = APIRouter(prefix="/api/rules", tags=["rules"])

class BulkDeleteRequest(BaseModel):
    rule_ids: List[int]

@router.get("", response_model=List[RuleResponse])
async def list_rules(db: Session = Depends(get_db)):
    """List all generated rules with optimized query"""
    rules = (
        db.query(Rule)
        .options(joinedload(Rule.job))
        .order_by(Rule.created_at.desc())
        .all()
    )
    return rules

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
    
    # Validate XML
    is_valid, error = validate_xml_rule(rule_update.rule_xml)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Update rule
    rule.rule_xml = rule_update.rule_xml
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    
    return rule

@router.post("/bulk-delete", status_code=200)
async def bulk_delete_rules(request: BulkDeleteRequest, db: Session = Depends(get_db)):
    """Bulk delete multiple rules"""
    rule_ids = request.rule_ids
    deleted_count = 0
    errors = []
    
    for rule_id in rule_ids:
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
    
    return {
        "deleted_count": deleted_count,
        "total_requested": len(rule_ids),
        "errors": errors
    }

@router.get("/bulk-export")
async def bulk_export_rules(rule_ids: List[int] = Query(...), db: Session = Depends(get_db)):
    """Export multiple rules as ZIP file"""
    rules = db.query(Rule).filter(Rule.id.in_(rule_ids)).all()
    
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

