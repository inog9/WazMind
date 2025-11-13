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
    
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        return False, f"File extension {ext} is not allowed. Allowed: {', '.join(allowed_extensions)}"
    return True, None

def validate_xml_rule(rule_xml: str) -> tuple[bool, Optional[str]]:
    """Basic XML validation for Wazuh rule"""
    if not rule_xml.strip():
        return False, "Rule XML cannot be empty"
    
    # Basic checks
    if "<rule" not in rule_xml.lower():
        return False, "Rule XML must contain a <rule> tag"
    
    if "id=" not in rule_xml.lower():
        return False, "Rule XML must contain an id attribute"
    
    return True, None

