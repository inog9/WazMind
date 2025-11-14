import os
import uuid
from pathlib import Path
from typing import Optional

def save_uploaded_file(file_content: bytes, filename: str, upload_dir: str) -> tuple[str, str]:
    """Save uploaded file and return (file_path, unique_filename)"""
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = Path(filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    return file_path, unique_filename

def read_log_sample(file_path: str, max_lines: int = 50) -> list[str]:
    """Read sample lines from log file with optimized reading"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Log file not found: {file_path}")
    
    lines = []
    try:
        # Use buffered reading for better performance
        with open(file_path, "r", encoding="utf-8", errors="ignore", buffering=8192) as f:
            for i, line in enumerate(f):
                if i >= max_lines:
                    break
                stripped = line.strip()
                if stripped:  # Skip empty lines
                    lines.append(stripped)
    except Exception as e:
        raise Exception(f"Error reading log file: {str(e)}")
    
    if not lines:
        raise ValueError("Log file is empty or contains no valid lines")
    
    return lines

def delete_file(file_path: str) -> bool:
    """Delete file if exists with proper error handling"""
    if not file_path:
        return False
    
    try:
        if os.path.exists(file_path) and os.path.isfile(file_path):
            os.remove(file_path)
            return True
        return False
    except PermissionError:
        raise PermissionError(f"Permission denied: Cannot delete {file_path}")
    except Exception as e:
        raise Exception(f"Error deleting file {file_path}: {str(e)}")

