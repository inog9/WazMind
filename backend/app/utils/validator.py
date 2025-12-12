import os
from typing import Optional
from .sanitizer import sanitize_filename, sanitize_error_message

def validate_file_size(file_size: int, max_size_mb: int) -> tuple[bool, Optional[str]]:
    """Validate file size"""
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        return False, f"File size exceeds maximum allowed size of {max_size_mb}MB"
    return True, None

def validate_file_extension(filename: str, allowed_extensions: list[str] = None) -> tuple[bool, Optional[str], str]:
    """Validate file extension and return sanitized filename"""
    if allowed_extensions is None:
        allowed_extensions = [".log", ".txt", ".json", ".csv"]
    
    if not filename:
        return False, "Filename cannot be empty", ""
    
    # Sanitize filename first
    sanitized_filename = sanitize_filename(filename)
    
    ext = os.path.splitext(sanitized_filename)[1].lower()
    if ext not in allowed_extensions:
        return False, f"File extension {ext} is not allowed. Allowed: {', '.join(allowed_extensions)}", ""
    
    # Additional security: check for path traversal attempts
    if ".." in sanitized_filename or "/" in sanitized_filename or "\\" in sanitized_filename:
        return False, "Invalid filename: path traversal detected", ""
    
    return True, None, sanitized_filename

def validate_and_fix_rule_id(rule_xml: str) -> str:
    """Fix invalid rule IDs like '100004-1' to proper integers"""
    import re
    
    # Pattern to find rule id="..." with invalid formats
    # Match: id="100004-1", id="100004.1", id="100004_1", etc.
    pattern = r'id="(\d+)[\-_\.](\d+)"'
    
    def replace_invalid_id(match):
        base_id = int(match.group(1))
        suffix = int(match.group(2))
        # Convert to sequential ID: 100004-1 becomes 100005, 100004-2 becomes 100006, etc.
        # If base is 100004 and suffix is 1, next ID should be 100005
        new_id = base_id + suffix
        return f'id="{new_id}"'
    
    # Replace invalid IDs
    fixed_xml = re.sub(pattern, replace_invalid_id, rule_xml)
    
    return fixed_xml

def validate_xml_rule(rule_xml: str) -> tuple[bool, Optional[str], str]:
    """Enhanced XML validation for Wazuh rule with XSS protection"""
    from .sanitizer import validate_and_sanitize_rule_xml
    
    # First, fix invalid rule IDs (like "100004-1" -> "100004")
    fixed_xml = validate_and_fix_rule_id(rule_xml)
    
    # Use sanitizer for validation
    is_valid, error, sanitized = validate_and_sanitize_rule_xml(fixed_xml)
    if not is_valid:
        return False, error, ""
    
    rule_xml_lower = sanitized.lower()
    
    # Check for rule tag
    if "<rule" not in rule_xml_lower:
        return False, "Rule XML must contain a <rule> tag", ""
    
    # Check for id attribute
    if "id=" not in rule_xml_lower:
        return False, "Rule XML must contain an id attribute", ""
    
    # Check for level attribute
    if "level=" not in rule_xml_lower:
        return False, "Rule XML must contain a level attribute", ""
    
    # Check for description
    if "<description>" not in rule_xml_lower:
        return False, "Rule XML should contain a description", ""
    
    # Basic XML structure check (opening and closing tags)
    rule_count = rule_xml_lower.count("<rule")
    if rule_count == 0:
        return False, "No rule tag found", ""
    
    return True, None, sanitized

