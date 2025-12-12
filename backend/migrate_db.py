"""
Database migration script to add new columns
"""
import sqlite3
import os
from pathlib import Path

def migrate_db():
    """Add rule_id column to jobs table if it doesn't exist"""
    # Get database path
    db_path = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # Extract path from SQLite URL
    if db_path.startswith("sqlite:///"):
        db_path = db_path.replace("sqlite:///", "")
        if not os.path.isabs(db_path):
            # Relative path - resolve from backend directory
            backend_dir = Path(__file__).parent
            db_path = os.path.join(backend_dir, db_path)
    else:
        # Assume it's already a path
        pass
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}, skipping migration")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if rule_id column exists
        cursor.execute("PRAGMA table_info(jobs)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'rule_id' not in columns:
            print("Adding rule_id column to jobs table...")
            cursor.execute("ALTER TABLE jobs ADD COLUMN rule_id INTEGER")
            conn.commit()
            print("✅ Successfully added rule_id column")
        else:
            print("✅ rule_id column already exists")
        
        conn.close()
    except Exception as e:
        print(f"Migration error: {str(e)}")
        raise

if __name__ == "__main__":
    migrate_db()
