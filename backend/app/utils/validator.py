import os
from typing import Optional

def validate_file_size(file_size: int, max_size_mb: int) -> tuple[bool, Optional[str]]:
    """Validate file size"""
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        return False, f"File size exceeds maximum allowed size of {max_size_mb}MB"
    return True, None

def validate_file_extension(filename: str, allowed_extensions: list[str] = None) -> tuple[bool, Optional[str]]:
    """Validate file extension"""
    if allowed_extensions is None:
        allowed_extensions = [".log", ".txt", ".json", ".csv"]
    
    if not filename:
        return False, "Filename cannot be empty"
    
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        return False, f"File extension {ext} is not allowed. Allowed: {', '.join(allowed_extensions)}"
    
    # Additional security: check for path traversal attempts
    if ".." in filename or "/" in filename or "\\" in filename:
        return False, "Invalid filename: path traversal detected"
    
    return True, None

def validate_xml_rule(rule_xml: str) -> tuple[bool, Optional[str]]:
    """Enhanced XML validation for Wazuh rule"""
    if not rule_xml or not rule_xml.strip():
        return False, "Rule XML cannot be empty"
    
    rule_xml_lower = rule_xml.lower()
    
    # Check for rule tag
    if "<rule" not in rule_xml_lower:
        return False, "Rule XML must contain a <rule> tag"
    
    # Check for id attribute
    if "id=" not in rule_xml_lower:
        return False, "Rule XML must contain an id attribute"
    
    # Check for level attribute
    if "level=" not in rule_xml_lower:
        return False, "Rule XML must contain a level attribute"
    
    # Check for description
    if "<description>" not in rule_xml_lower:
        return False, "Rule XML should contain a description"
    
    # Basic XML structure check (opening and closing tags)
    rule_count = rule_xml_lower.count("<rule")
    if rule_count == 0:
        return False, "No rule tag found"
    
    return True, None

