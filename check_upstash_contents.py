"""
Check Upstash Database Contents and Explain Namespace Implementation
"""

import os
from dotenv import load_dotenv
from upstash_vector import Index

load_dotenv()

def check_database_contents():
    """Check what's actually stored in Upstash"""
    print("🔍 Checking Upstash Vector Database Contents")
    print("=" * 60)
    
    try:
        # Connect to Upstash
        index = Index.from_env()
        print("✅ Connected to Upstash Vector")
        
        # Get database info
        try:
            info = index.info()
            total_vectors = getattr(info, 'vector_count', 'Unknown')
            print(f"📊 Total vectors in database: {total_vectors}")
        except Exception as e:
            print(f"⚠️ Could not get database info: {str(e)}")
        
        # Test queries to see what namespaces exist
        print("\n🔍 Testing namespace queries...")
        
        # Query for digital twin data
        print("\n1. Searching for digital twin data:")
        try:
            dt_results = index.query(
                data="experience work internship",
                top_k=3,
                include_metadata=True
            )
            
            dt_count = 0
            for result in dt_results:
                if result.metadata and result.metadata.get('namespace') == 'dt':
                    dt_count += 1
                    print(f"   ✓ Found: {result.id} - {result.metadata.get('title', 'No title')}")
            
            print(f"   📊 Digital twin vectors found: {dt_count}")
                    
        except Exception as e:
            print(f"   ❌ Error querying digital twin data: {str(e)}")
        
        # Query for food data  
        print("\n2. Searching for food data:")
        try:
            food_results = index.query(
                data="food nutrition protein",
                top_k=3,
                include_metadata=True
            )
            
            food_count = 0
            for result in food_results:
                if result.metadata and result.metadata.get('namespace') == 'food':
                    food_count += 1
                    print(f"   ✓ Found: {result.id} - {result.metadata.get('title', 'No title')}")
            
            print(f"   📊 Food vectors found: {food_count}")
                    
        except Exception as e:
            print(f"   ❌ Error querying food data: {str(e)}")
        
        # Show sample vectors with metadata
        print("\n3. Sample vector metadata:")
        try:
            sample_results = index.query(
                data="sample query",
                top_k=5,
                include_metadata=True
            )
            
            for i, result in enumerate(sample_results):
                print(f"\n   Vector {i+1}:")
                print(f"   ID: {result.id}")
                print(f"   Score: {result.score:.3f}")
                if result.metadata:
                    print(f"   Namespace: {result.metadata.get('namespace', 'None')}")
                    print(f"   Title: {result.metadata.get('title', 'None')}")
                    print(f"   Type: {result.metadata.get('type', 'None')}")
                    print(f"   Source: {result.metadata.get('source', 'None')}")
                else:
                    print("   Metadata: None")
                    
        except Exception as e:
            print(f"   ❌ Error getting sample vectors: {str(e)}")
        
        print("\n" + "="*60)
        print("📝 IMPORTANT CLARIFICATION:")
        print("Upstash Vector doesn't have built-in 'namespaces' like you see in the UI.")
        print("We implemented namespace simulation using metadata tags:")
        print("  • namespace='dt' in metadata")
        print("  • namespace='food' in metadata") 
        print("  • ID prefixes: 'dt-' and 'food-'")
        print("\nThis gives us namespace-like behavior through filtering!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    check_database_contents()