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
    """Read sample lines from log file"""
    lines = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f):
                if i >= max_lines:
                    break
                lines.append(line.strip())
    except Exception as e:
        raise Exception(f"Error reading log file: {str(e)}")
    
    return lines

def delete_file(file_path: str) -> bool:
    """Delete file if exists"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return False

