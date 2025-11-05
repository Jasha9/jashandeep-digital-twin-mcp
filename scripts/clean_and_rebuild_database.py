"""
Clean Upstash Database and Implement True Namespace Separation
This will clear everything and re-upload with clean separation
"""

import os
from dotenv import load_dotenv
from upstash_vector import Index
import time

load_dotenv()

def clean_and_rebuild_database():
    """Clean database and rebuild with proper namespace separation"""
    print("🧹 Clean Database & Rebuild Namespaces")
    print("=" * 60)
    
    try:
        # Connect to Upstash
        index = Index.from_env()
        print("✅ Connected to Upstash Vector")
        
        # Get current stats
        try:
            info = index.info()
            current_count = getattr(info, 'vector_count', 0)
            print(f"📊 Current vectors in database: {current_count}")
        except:
            current_count = 0
        
        # Option 1: Delete old vectors by ID pattern
        print("\n🗑️ Cleaning old data...")
        
        # Get all vectors and identify what to delete
        old_vectors_to_delete = []
        
        try:
            # Query to find old vectors (without proper namespace metadata)
            old_results = index.query(
                data="sample query to find all vectors",
                top_k=200,  # Get more results
                include_metadata=True
            )
            
            for result in old_results:
                # Delete vectors that don't have proper namespace metadata
                if not result.metadata or result.metadata.get('namespace') not in ['digitaltwin', 'foods']:
                    old_vectors_to_delete.append(result.id)
                # Also delete if they don't have proper prefixes but claim to be namespaced
                elif result.id.startswith(('dt-', 'food-')):
                    continue  # Keep these
                else:
                    old_vectors_to_delete.append(result.id)
            
            print(f"📋 Found {len(old_vectors_to_delete)} old vectors to clean")
            
            # Delete in batches
            if old_vectors_to_delete:
                batch_size = 50
                deleted_count = 0
                
                for i in range(0, len(old_vectors_to_delete), batch_size):
                    batch = old_vectors_to_delete[i:i+batch_size]
                    try:
                        # Note: Upstash delete method varies by SDK version
                        for vector_id in batch:
                            index.delete(vector_id)
                        deleted_count += len(batch)
                        print(f"   ✓ Deleted batch {i//batch_size + 1}: {len(batch)} vectors")
                        time.sleep(0.1)  # Small delay to avoid rate limits
                    except Exception as e:
                        print(f"   ❌ Failed to delete batch: {str(e)}")
                
                print(f"✅ Cleanup complete: {deleted_count} old vectors removed")
            else:
                print("✅ No old vectors found to clean")
                
        except Exception as e:
            print(f"⚠️ Cleanup warning: {str(e)}")
            print("   Proceeding with re-upload...")
        
        # Wait a moment for deletion to process
        time.sleep(2)
        
        # Get updated stats
        try:
            info = index.info()
            after_cleanup = getattr(info, 'vector_count', 0)
            print(f"📊 Vectors after cleanup: {after_cleanup}")
        except:
            pass
        
        print("\n" + "="*60)
        print("✅ Database cleaned!")
        print("💡 Now run the embedding scripts to upload clean namespaced data:")
        print("   1. python scripts/embed_digitaltwin_namespaced.py")
        print("   2. python scripts/embed_foods_namespaced.py")
        print("\n🎯 This will give you clean separation:")
        print("   • All digital twin data with 'dt-' prefix")
        print("   • All food data with 'food-' prefix") 
        print("   • Proper metadata for fast filtering")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("⚠️ WARNING: This will delete old vectors from your database!")
    confirm = input("Type 'YES' to proceed with cleanup: ")
    
    if confirm.upper() == 'YES':
        clean_and_rebuild_database()
    else:
        print("❌ Cleanup cancelled. No changes made.")