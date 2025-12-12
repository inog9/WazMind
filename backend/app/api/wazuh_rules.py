"""
API endpoints for Wazuh rules scanning and management
"""
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, String
from typing import List, Optional
import logging
import os
from pathlib import Path
from datetime import datetime

from ..db import get_db, Base, engine
from ..models import WazuhRule
from ..schemas import PaginatedResponse, WazuhRuleResponse
from ..utils.rule_parser import scan_wazuh_rules
from ..utils.cache import cache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/wazuh/rules", tags=["wazuh-rules"])

# Default paths - can be overridden via environment variables
DEFAULT_RULESET_PATH = os.getenv("WAZUH_RULESET_PATH", "/var/ossec/ruleset/rules")
DEFAULT_CUSTOM_RULES_PATH = os.getenv("WAZUH_CUSTOM_RULES_PATH", "/var/ossec/etc/rules")

# For development, use local paths if they exist
# Go up from backend/app/api/ to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
LOCAL_RULESET_PATH = os.path.join(PROJECT_ROOT, "rules")
LOCAL_CUSTOM_RULES_PATH = os.path.join(PROJECT_ROOT, "rules")  # Same folder for now

def get_rules_paths():
    """Get the paths to scan - prefer local paths if they exist for development"""
    ruleset_path = DEFAULT_RULESET_PATH
    custom_path = DEFAULT_CUSTOM_RULES_PATH
    
    # Check if local paths exist (for development)
    if Path(LOCAL_RULESET_PATH).exists():
        ruleset_path = LOCAL_RULESET_PATH
        logger.info(f"Using local ruleset path: {ruleset_path}")
    
    # For now, custom rules are in the same folder
    # In production, they would be in /var/ossec/etc/rules
    if Path(LOCAL_CUSTOM_RULES_PATH).exists():
        custom_path = LOCAL_CUSTOM_RULES_PATH
        logger.info(f"Using local custom rules path: {custom_path}")
    
    return ruleset_path, custom_path

@router.post("/scan")
async def scan_rules(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Scan Wazuh rules from server directories"""
    try:
        ruleset_path, custom_path = get_rules_paths()
        
        # Scan rules
        scan_result = scan_wazuh_rules(ruleset_path, custom_path)
        
        # Clear existing rules
        db.query(WazuhRule).delete()
        
        # Insert new rules
        for rule_data in scan_result['rules']:
            wazuh_rule = WazuhRule(**rule_data)
            db.add(wazuh_rule)
        
        db.commit()
        
        # Invalidate cache
        cache.delete("wazuh_rule_count")
        cache.delete("wazuh_rule_statistics")
        
        logger.info(f"Successfully scanned and stored {len(scan_result['rules'])} rules")
        
        return {
            "message": "Rules scanned successfully",
            "statistics": scan_result['statistics'],
            "rules_count": len(scan_result['rules'])
        }
    except Exception as e:
        logger.error(f"Error scanning rules: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error scanning rules: {str(e)}")

@router.get("/statistics")
async def get_statistics(db: Session = Depends(get_db)):
    """Get statistics about scanned rules"""
    cache_key = "wazuh_rule_statistics"
    cached_stats = cache.get(cache_key)
    if cached_stats:
        return cached_stats
    
    total = db.query(WazuhRule).count()
    custom = db.query(WazuhRule).filter(WazuhRule.source == 'custom').count()
    default = db.query(WazuhRule).filter(WazuhRule.source == 'default').count()
    overwritten = db.query(WazuhRule).filter(WazuhRule.is_overwritten == 1).count()
    
    stats = {
        "total": total,
        "custom": custom,
        "default": default,
        "overwritten": overwritten
    }
    
    cache.set(cache_key, stats, ttl=60)  # Cache for 1 minute
    return stats

@router.get("", response_model=PaginatedResponse[WazuhRuleResponse])
async def list_rules(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    source: Optional[str] = Query(None, description="Filter by source: 'custom' or 'default'"),
    level: Optional[int] = Query(None, ge=0, le=15, description="Filter by level"),
    search: Optional[str] = Query(None, description="Search by rule ID, description, or groups"),
    db: Session = Depends(get_db)
):
    """List scanned Wazuh rules with pagination and filters"""
    import math
    
    # Build query
    query = db.query(WazuhRule)
    
    # Apply filters
    if source:
        query = query.filter(WazuhRule.source == source)
    
    if level is not None:
        query = query.filter(WazuhRule.level == level)
    
    if search:
        search_term = f"%{search}%"
        # Try to parse as integer for rule_id search
        try:
            rule_id_int = int(search)
            query = query.filter(
                or_(
                    WazuhRule.rule_id == rule_id_int,
                    WazuhRule.description.like(search_term),
                    WazuhRule.groups.like(search_term)
                )
            )
        except ValueError:
            # Not a number, search in description and groups only
            query = query.filter(
                or_(
                    WazuhRule.description.like(search_term),
                    WazuhRule.groups.like(search_term)
                )
            )
    
    # Get total count
    cache_key = f"wazuh_rule_count_{source}_{level}_{search}"
    total = cache.get(cache_key)
    if total is None:
        total = query.count()
        cache.set(cache_key, total, ttl=30)
    
    # Pagination
    offset = (page - 1) * limit
    rules = query.order_by(WazuhRule.rule_id.asc()).offset(offset).limit(limit).all()
    
    # Calculate total pages
    total_pages = math.ceil(total / limit) if total > 0 else 0
    
    # Convert SQLAlchemy models to Pydantic models for proper serialization
    rule_responses = [WazuhRuleResponse.model_validate(rule) for rule in rules]
    
    return {
        "items": rule_responses,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/conflicts")
async def get_conflicts(db: Session = Depends(get_db)):
    """Get rules with conflicts (duplicate IDs or overwritten)"""
    # Find duplicate rule IDs
    from sqlalchemy import func
    
    duplicates = db.query(
        WazuhRule.rule_id,
        func.count(WazuhRule.id).label('count')
    ).group_by(WazuhRule.rule_id).having(func.count(WazuhRule.id) > 1).all()
    
    # Get overwritten rules (limit to first 10 for response)
    overwritten = db.query(WazuhRule).filter(WazuhRule.is_overwritten == 1).limit(10).all()
    
    # Convert to response models (Pydantic v2 uses model_validate)
    try:
        overwritten_rules = [WazuhRuleResponse.model_validate(rule) for rule in overwritten]
    except AttributeError:
        # Fallback for Pydantic v1
        overwritten_rules = [WazuhRuleResponse.from_orm(rule) for rule in overwritten]
    
    return {
        "duplicate_ids": [d.rule_id for d in duplicates],
        "overwritten_count": db.query(WazuhRule).filter(WazuhRule.is_overwritten == 1).count(),
        "overwritten_rules": overwritten_rules
    }

@router.get("/heatmap")
async def get_heatmap(
    range_size: int = Query(1000, ge=100, le=10000, description="Size of each range block"),
    db: Session = Depends(get_db)
):
    """Get Rule ID heatmap data showing ID distribution"""
    cache_key = f"wazuh_heatmap_{range_size}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    # Get all rule IDs
    all_rules = db.query(WazuhRule.rule_id).all()
    rule_ids = [r.rule_id for r in all_rules]
    
    # Define ranges: 0-100000 (default), 100000-120000 (custom)
    max_id = 120000
    ranges = []
    
    for start in range(0, max_id, range_size):
        end = min(start + range_size, max_id)
        count = sum(1 for rid in rule_ids if start <= rid < end)
        
        # Calculate density (0-1)
        density = count / range_size if range_size > 0 else 0
        
        ranges.append({
            "start": start,
            "end": end - 1,  # Inclusive end
            "count": count,
            "density": density,
            "is_custom_range": start >= 100000
        })
    
    # Calculate statistics
    default_range_ids = [rid for rid in rule_ids if rid < 100000]
    custom_range_ids = [rid for rid in rule_ids if 100000 <= rid < 120000]
    
    result = {
        "ranges": ranges,
        "statistics": {
            "total_rules": len(rule_ids),
            "default_range_count": len(default_range_ids),
            "custom_range_count": len(custom_range_ids),
            "max_id": max(rule_ids) if rule_ids else 0,
            "min_id": min(rule_ids) if rule_ids else 0,
            "available_custom_ids": 20000 - len(custom_range_ids)  # 100000-120000 = 20000 slots
        },
        "range_size": range_size
    }
    
    cache.set(cache_key, result, ttl=300)  # Cache for 5 minutes
    return result

@router.get("/id-suggestion")
async def suggest_rule_id(
    count: int = Query(1, ge=1, le=10, description="Number of IDs to suggest"),
    db: Session = Depends(get_db)
):
    """Suggest available rule IDs for custom rules (100000-120000)"""
    # Get all existing custom rule IDs
    existing_ids = set(
        r.rule_id for r in db.query(WazuhRule.rule_id)
        .filter(WazuhRule.rule_id >= 100000)
        .filter(WazuhRule.rule_id < 120000)
        .all()
    )
    
    # Find available IDs
    suggestions = []
    for candidate_id in range(100000, 120000):
        if candidate_id not in existing_ids:
            suggestions.append(candidate_id)
            if len(suggestions) >= count:
                break
    
    return {
        "suggested_ids": suggestions,
        "available_count": 20000 - len(existing_ids),
        "range": {"start": 100000, "end": 119999}
    }

@router.get("/{rule_id}", response_model=WazuhRuleResponse)
async def get_rule(rule_id: int, db: Session = Depends(get_db)):
    """Get a specific rule by Wazuh rule ID"""
    rule = db.query(WazuhRule).filter(WazuhRule.rule_id == rule_id).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    
    return rule

