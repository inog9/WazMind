"""
Security utilities for sanitizing user input and preventing XSS, SQL Injection, and Command Injection attacks
"""
import re
import html
import os
from pathlib import Path
from typing import Optional

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and XSS
    Removes dangerous characters and limits length
    """
    if not filename:
        return "unnamed"
    
    # Remove path traversal attempts
    filename = filename.replace("..", "")
    filename = filename.replace("/", "")
    filename = filename.replace("\\", "")
    
    # Remove null bytes
    filename = filename.replace("\x00", "")
    
    # Remove control characters
    filename = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', filename)
    
    # Limit length
    filename = filename[:255]
    
    # Remove leading/trailing dots and spaces (Windows issue)
    filename = filename.strip('. ')
    
    return filename or "unnamed"

def sanitize_error_message(message: str) -> str:
    """
    Sanitize error messages to prevent XSS when displayed in UI
    """
    if not message:
        return ""
    
    # HTML escape
    sanitized = html.escape(str(message))
    
    # Limit length to prevent DoS
    sanitized = sanitized[:500]
    
    return sanitized

def sanitize_xml_content(xml_content: str) -> str:
    """
    Basic sanitization for XML content (for display purposes)
    Note: This doesn't validate XML structure, just removes dangerous patterns
    """
    if not xml_content:
        return ""
    
    # Remove script tags and event handlers
    xml_content = re.sub(r'<script[^>]*>.*?</script>', '', xml_content, flags=re.IGNORECASE | re.DOTALL)
    xml_content = re.sub(r'on\w+\s*=', '', xml_content, flags=re.IGNORECASE)
    
    # Remove javascript: protocol
    xml_content = re.sub(r'javascript:', '', xml_content, flags=re.IGNORECASE)
    
    return xml_content

def validate_and_sanitize_rule_xml(rule_xml: str) -> tuple[bool, Optional[str], str]:
    """
    Validate and sanitize rule XML
    Returns: (is_valid, error_message, sanitized_xml)
    """
    if not rule_xml or not rule_xml.strip():
        return False, "Rule XML cannot be empty", ""
    
    # Basic sanitization
    sanitized = sanitize_xml_content(rule_xml)
    
    # Check for dangerous patterns
    dangerous_patterns = [
        r'<script',
        r'javascript:',
        r'onerror\s*=',
        r'onload\s*=',
        r'<iframe',
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, sanitized, re.IGNORECASE):
            return False, f"Rule XML contains potentially dangerous content: {pattern}", ""
    
    return True, None, sanitized

def validate_file_path(file_path: str, allowed_base_dir: str) -> tuple[bool, Optional[str], str]:
    """
    Validate and sanitize file path to prevent path traversal and command injection
    Returns: (is_valid, error_message, sanitized_path)
    """
    if not file_path:
        return False, "File path cannot be empty", ""
    
    # Convert to absolute path
    try:
        # Normalize path
        normalized_path = os.path.normpath(file_path)
        
        # Ensure it's within allowed directory
        allowed_base = os.path.abspath(allowed_base_dir)
        absolute_path = os.path.abspath(normalized_path)
        
        # Check if path is within allowed directory
        if not absolute_path.startswith(allowed_base):
            return False, "File path is outside allowed directory", ""
        
        # Additional checks for dangerous patterns
        if ".." in normalized_path:
            return False, "Path traversal detected", ""
        
        # Check for null bytes
        if "\x00" in file_path:
            return False, "Null byte detected in path", ""
        
        # Check for command injection patterns
        dangerous_chars = [';', '|', '&', '`', '$', '(', ')', '<', '>', '\n', '\r']
        for char in dangerous_chars:
            if char in file_path:
                return False, f"Dangerous character detected: {char}", ""
        
        return True, None, absolute_path
        
    except Exception as e:
        return False, f"Invalid file path: {str(e)}", ""

def validate_integer_id(id_value: any) -> tuple[bool, Optional[int]]:
    """
    Validate and convert ID to integer safely
    Returns: (is_valid, integer_id or None)
    """
    try:
        if isinstance(id_value, int):
            if id_value < 1:
                return False, None
            return True, id_value
        
        if isinstance(id_value, str):
            # Only allow digits
            if not id_value.isdigit():
                return False, None
            int_id = int(id_value)
            if int_id < 1:
                return False, None
            return True, int_id
        
        return False, None
    except (ValueError, TypeError):
        return False, None

def sanitize_list_of_ids(id_list: list) -> tuple[bool, Optional[str], list[int]]:
    """
    Validate and sanitize list of IDs
    Returns: (is_valid, error_message, sanitized_ids)
    """
    if not isinstance(id_list, list):
        return False, "IDs must be a list", []
    
    if len(id_list) == 0:
        return False, "ID list cannot be empty", []
    
    if len(id_list) > 100:  # Limit bulk operations
        return False, "Too many IDs (maximum 100)", []
    
    sanitized_ids = []
    for id_val in id_list:
        is_valid, int_id = validate_integer_id(id_val)
        if not is_valid:
            return False, f"Invalid ID: {id_val}", []
        sanitized_ids.append(int_id)
    
    return True, None, sanitized_ids

