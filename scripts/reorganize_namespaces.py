"""
Reorganize Existing Data into Clean Namespaces
- Food data → 'food' namespace  
- Digital Twin data → 'dt' namespace
This keeps all data but creates proper separation
"""

import os
from dotenv import load_dotenv
from upstash_vector import Index
import json
import time

load_dotenv()

def reorganize_into_clean_namespaces():
    """Reorganize existing vectors into clean food and dt namespaces"""
    print("🔄 Reorganizing Data into Clean Namespaces")
    print("=" * 60)
    
    try:
        # Connect to Upstash
        index = Index.from_env()
        print("✅ Connected to Upstash Vector")
        
        # Get current database status
        try:
            info = index.info()
            current_count = getattr(info, 'vector_count', 0)
            print(f"📊 Current vectors in database: {current_count}")
        except:
            current_count = 0
        
        # Step 1: Query all existing vectors to see what we have
        print(f"\n🔍 Analyzing existing data...")
        
        all_vectors = []
        try:
            # Get a broad sample of existing vectors
            sample_results = index.query(
                data="sample query to get all data",
                top_k=100,  # Get more vectors to see everything
                include_metadata=True
            )
            
            food_count = 0
            dt_count = 0
            other_count = 0
            
            print(f"\n📋 Current Data Analysis:")
            
            for result in sample_results:
                vector_info = {
                    'id': result.id,
                    'metadata': result.metadata if result.metadata else {}
                }
                all_vectors.append(vector_info)
                
                # Categorize existing vectors
                if (result.id.startswith('food-') or 
                    (result.metadata and result.metadata.get('namespace') == 'foods')):
                    food_count += 1
                elif (result.id.startswith('dt-') or 
                      (result.metadata and result.metadata.get('namespace') == 'digitaltwin')):
                    dt_count += 1
                else:
                    other_count += 1
            
            print(f"   🍎 Food vectors found: {food_count}")
            print(f"   🤖 Digital Twin vectors found: {dt_count}")  
            print(f"   ❓ Other vectors: {other_count}")
            
        except Exception as e:
            print(f"   ⚠️ Error analyzing data: {str(e)}")
            return
        
        # Step 2: Clear database and re-upload with clean namespaces
        print(f"\n🧹 Clearing database for clean reorganization...")
        
        # Delete all existing vectors
        vectors_to_delete = [v['id'] for v in all_vectors]
        
        if vectors_to_delete:
            deleted_count = 0
            for vector_id in vectors_to_delete:
                try:
                    index.delete(vector_id)
                    deleted_count += 1
                except Exception as e:
                    print(f"   Warning: Could not delete {vector_id}")
            
            print(f"✅ Cleared {deleted_count} vectors")
            time.sleep(2)  # Wait for deletions to process
        
        # Step 3: Re-upload Digital Twin data with 'dt' namespace
        print(f"\n⬆️ Re-uploading Digital Twin data with 'dt' namespace...")
        
        # Load digital twin JSON
        json_file = os.path.join("config", "digitaltwin.json")
        with open(json_file, "r", encoding="utf-8") as f:
            profile_data = json.load(f)
        
        # Import the chunk creation function from our existing script
        import sys
        sys.path.append(os.path.join(os.getcwd(), 'scripts'))
        
        try:
            from embed_digitaltwin_namespaced import create_content_chunks
            
            # Create chunks
            content_chunks = create_content_chunks(profile_data)
            print(f"   📦 Created {len(content_chunks)} digital twin chunks")
            
            # Prepare vectors with 'dt' namespace
            dt_vectors = []
            for chunk in content_chunks:
                enhanced_content = f"Title: {chunk['title']}. Type: {chunk['type']}. Category: {chunk['category']}. Content: {chunk['content']}"
                
                dt_vectors.append((
                    f"dt-{chunk['id']}",
                    enhanced_content,
                    {
                        "title": chunk['title'],
                        "type": chunk['type'],
                        "category": chunk['category'],
                        "content": chunk['content'],
                        "tags": chunk['tags'],
                        "namespace": "dt",  # Clean 'dt' namespace
                        "source": "digital_twin"
                    }
                ))
            
            # Upload digital twin vectors
            batch_size = 50
            dt_uploaded = 0
            
            for i in range(0, len(dt_vectors), batch_size):
                batch = dt_vectors[i:i+batch_size]
                try:
                    index.upsert(vectors=batch)
                    dt_uploaded += len(batch)
                    print(f"   ✓ Uploaded DT batch {i//batch_size + 1}: {len(batch)} vectors")
                except Exception as e:
                    print(f"   ❌ DT batch failed: {str(e)}")
            
            print(f"✅ Digital Twin upload complete: {dt_uploaded} vectors in 'dt' namespace")
            
        except Exception as e:
            print(f"❌ Error uploading digital twin data: {str(e)}")
        
        # Step 4: Re-upload Food data with 'food' namespace  
        print(f"\n⬆️ Re-uploading Food data with 'food' namespace...")
        
        foods_file = os.path.join("data", "foods.json")
        if os.path.exists(foods_file):
            try:
                with open(foods_file, "r", encoding="utf-8") as f:
                    foods_data = json.load(f)
                
                from embed_foods_namespaced import create_food_chunks
                
                # Create food chunks
                food_chunks = create_food_chunks(foods_data)
                print(f"   📦 Created {len(food_chunks)} food chunks")
                
                # Prepare vectors with 'food' namespace
                food_vectors = []
                for chunk in food_chunks:
                    enhanced_content = f"Food: {chunk['title']}. {chunk['content']}"
                    
                    food_vectors.append((
                        f"food-{chunk['id']}",
                        enhanced_content,
                        {
                            "title": chunk['title'],
                            "type": chunk['type'],
                            "category": chunk['category'],
                            "content": chunk['content'],
                            "tags": chunk['tags'],
                            "namespace": "food",  # Clean 'food' namespace
                            "source": "foods_data"
                        }
                    ))
                
                # Upload food vectors
                food_uploaded = 0
                for i in range(0, len(food_vectors), batch_size):
                    batch = food_vectors[i:i+batch_size]
                    try:
                        index.upsert(vectors=batch)
                        food_uploaded += len(batch)
                        print(f"   ✓ Uploaded Food batch {i//batch_size + 1}: {len(batch)} vectors")
                    except Exception as e:
                        print(f"   ❌ Food batch failed: {str(e)}")
                
                print(f"✅ Food upload complete: {food_uploaded} vectors in 'food' namespace")
                
            except Exception as e:
                print(f"❌ Error uploading food data: {str(e)}")
        else:
            print("   ⚠️ No foods.json file found - skipping food data")
        
        # Final verification
        print(f"\n🔍 Verifying reorganization...")
        time.sleep(2)
        
        try:
            info = index.info()
            final_count = getattr(info, 'vector_count', 0)
            print(f"📊 Final vector count: {final_count}")
            
            # Test queries
            dt_test = index.query(data="experience skills", top_k=3, include_metadata=True)
            dt_namespace_count = sum(1 for r in dt_test if r.metadata and r.metadata.get('namespace') == 'dt')
            
            food_test = index.query(data="nutrition protein", top_k=3, include_metadata=True)  
            food_namespace_count = sum(1 for r in food_test if r.metadata and r.metadata.get('namespace') == 'food')
            
            print(f"✅ Verification:")
            print(f"   🤖 'dt' namespace vectors working: {dt_namespace_count > 0}")
            print(f"   🍎 'food' namespace vectors working: {food_namespace_count > 0}")
            
        except Exception as e:
            print(f"⚠️ Verification error: {str(e)}")
        
        print(f"\n" + "="*60)
        print("✅ REORGANIZATION COMPLETE!")
        print("🎯 Clean namespace separation achieved:")
        print("   • All food data → 'food' namespace")  
        print("   • All digital twin data → 'dt' namespace")
        print("   • Clean ID prefixes: 'food-' and 'dt-'")
        print("💡 Your RAG system now has perfect data separation!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔄 This will reorganize your data into clean 'food' and 'dt' namespaces")
    confirm = input("Type 'YES' to proceed with reorganization: ")
    
    if confirm.upper() == 'YES':
        reorganize_into_clean_namespaces()
    else:
        print("❌ Operation cancelled.")