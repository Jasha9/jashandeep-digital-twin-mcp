"""
Reset Upstash Vector Database
Clears all existing vectors to start fresh with Digital Twin data
"""

import os
from dotenv import load_dotenv
from upstash_vector import Index

# Load environment variables
load_dotenv()

def reset_database():
    """Clear all vectors from Upstash database"""
    print("🔄 Connecting to Upstash Vector...")
    
    try:
        index = Index.from_env()
        print("✅ Connected successfully!")
        
        # Get current info
        info = index.info()
        current_count = getattr(info, 'vector_count', 0)
        print(f"📊 Current vectors in database: {current_count}")
        
        if current_count == 0:
            print("✅ Database is already empty!")
            return
        
        # Confirm deletion
        print(f"\n⚠️  WARNING: This will delete all {current_count} vectors!")
        confirm = input("Type 'yes' to confirm deletion: ")
        
        if confirm.lower() != 'yes':
            print("❌ Operation cancelled.")
            return
        
        # Reset the database
        print("\n🗑️  Deleting all vectors...")
        index.reset()
        print("✅ Database reset successfully!")
        
        # Verify
        info = index.info()
        final_count = getattr(info, 'vector_count', 0)
        print(f"📊 Final vector count: {final_count}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    reset_database()
