from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from ..db import get_db
from ..models import Rule, Job
from ..schemas import RuleResponse, RuleUpdate
from ..utils.validator import validate_xml_rule
from datetime import datetime

router = APIRouter(prefix="/api/rules", tags=["rules"])

@router.get("", response_model=List[RuleResponse])
async def list_rules(db: Session = Depends(get_db)):
    """List all generated rules"""
    rules = db.query(Rule).order_by(Rule.created_at.desc()).all()
    return rules

@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: int, db: Session = Depends(get_db)):
    """Get a specific rule"""
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.get("/job/{job_id}", response_model=RuleResponse)
async def get_rule_by_job(job_id: int, db: Session = Depends(get_db)):
    """Get rule by job ID"""
    rule = db.query(Rule).filter(Rule.job_id == job_id).first()
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

@router.delete("/{rule_id}", status_code=204)
async def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete a rule"""
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    return None

