import re
from typing import Optional

def extract_rule_id(rule_xml: str) -> Optional[int]:
    """Extract rule ID from XML"""
    match = re.search(r'id=["\'](\d+)["\']', rule_xml)
    if match:
        return int(match.group(1))
    return None

def extract_rule_level(rule_xml: str) -> Optional[int]:
    """Extract rule level from XML"""
    match = re.search(r'level=["\'](\d+)["\']', rule_xml)
    if match:
        return int(match.group(1))
    return None

def validate_rule_structure(rule_xml: str) -> tuple[bool, Optional[str]]:
    """Validate basic Wazuh rule structure"""
    # Check for required elements
    if not re.search(r'<rule\s+id=["\']\d+["\']', rule_xml, re.IGNORECASE):
        return False, "Rule must have an id attribute"
    
    if not re.search(r'level=["\']\d+["\']', rule_xml, re.IGNORECASE):
        return False, "Rule must have a level attribute"
    
    # Check for description
    if not re.search(r'<description>', rule_xml, re.IGNORECASE):
        return False, "Rule should have a description"
    
    return True, None

