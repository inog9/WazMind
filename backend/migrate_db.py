#!/usr/bin/env python3
"""Database migration script to add new columns to jobs table"""
import sqlite3
import os
from pathlib import Path

def migrate_db():
    """Run database migration"""
    # Get database path - use same logic as db.py
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    if "sqlite" in DATABASE_URL:
        db_path = DATABASE_URL.replace("sqlite:///", "")
        if db_path == ":memory:":
            print("In-memory database, no migration needed")
            return
        
        # Convert relative path to absolute
        if not os.path.isabs(db_path):
            db_path = os.path.abspath(db_path)
        
        if not os.path.exists(db_path):
            print(f"Database {db_path} does not exist. It will be created on next run.")
            return
        
        print(f"Migrating database: {db_path}")
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Check if table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='jobs'")
            if not cursor.fetchone():
                print("Jobs table does not exist yet. It will be created on next run.")
                conn.close()
                return
            
            # Check if columns already exist
            cursor.execute("PRAGMA table_info(jobs)")
            columns = [row[1] for row in cursor.fetchall()]
            
            # Add retry_count if it doesn't exist
            if 'retry_count' not in columns:
                print("Adding retry_count column...")
                cursor.execute("ALTER TABLE jobs ADD COLUMN retry_count INTEGER DEFAULT 0")
                print("✓ retry_count column added")
            else:
                print("✓ retry_count column already exists")
            
            # Add started_at if it doesn't exist
            if 'started_at' not in columns:
                print("Adding started_at column...")
                cursor.execute("ALTER TABLE jobs ADD COLUMN started_at DATETIME")
                print("✓ started_at column added")
            else:
                print("✓ started_at column already exists")
            
            conn.commit()
            print("\n✅ Database migration completed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"\n❌ Migration failed: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            conn.close()

if __name__ == "__main__":
    migrate_db()
