"""
Food Data Embedding Script with Namespace Support  
For embedding food.json data using 'foods' namespace
This keeps food data separate from digital twin data for better performance
"""

import os
import json
from dotenv import load_dotenv
from upstash_vector import Index

# Load environment variables
load_dotenv()

# Configuration
FOODS_JSON_PATH = os.path.join("data", "foods.json")
NAMESPACE = "foods"

def create_food_chunks(foods_data):
    """Convert foods JSON into searchable content chunks"""
    chunks = []
    
    # Handle different possible structures
    foods_list = []
    if isinstance(foods_data, list):
        foods_list = foods_data
    elif isinstance(foods_data, dict):
        # Check common keys
        if 'foods' in foods_data:
            foods_list = foods_data['foods']
        elif 'items' in foods_data:
            foods_list = foods_data['items']
        elif 'data' in foods_data:
            foods_list = foods_data['data']
        else:
            # Assume the dict itself contains food data
            foods_list = [foods_data]
    
    for i, food in enumerate(foods_list):
        # Extract food information based on possible key variations
        name = food.get('name') or food.get('food_name') or food.get('title') or f"Food Item {i+1}"
        
        # Build comprehensive food description
        content_parts = [f"Food: {name}"]
        
        # Add various food attributes that might exist
        attributes = [
            'description', 'ingredients', 'nutrition', 'calories', 
            'country', 'origin', 'cuisine', 'category', 'type',
            'preparation', 'cooking_method', 'allergens', 'dietary_info',
            'taste', 'texture', 'color', 'season', 'benefits'
        ]
        
        for attr in attributes:
            value = food.get(attr)
            if value:
                if isinstance(value, list):
                    content_parts.append(f"{attr.replace('_', ' ').title()}: {', '.join(map(str, value))}")
                else:
                    content_parts.append(f"{attr.replace('_', ' ').title()}: {value}")
        
        content = ". ".join(content_parts)
        
        # Extract tags from food data
        tags = ['food']
        if food.get('country'):
            tags.append(food['country'].lower())
        if food.get('cuisine'):
            tags.append(food['cuisine'].lower())
        if food.get('category'):
            tags.append(food['category'].lower())
        if food.get('type'):
            tags.append(food['type'].lower())
        
        chunks.append({
            "id": f"food_{i+1}",
            "title": name,
            "content": content,
            "type": "food_item",
            "category": "nutrition",
            "tags": tags,
            "original_data": food  # Keep original for reference
        })
    
    return chunks

def embed_foods_data():
    """Upload Foods data to Upstash Vector with namespace support"""
    print("🍎 Food Data Embedding with Namespaces")
    print("=" * 50)
    
    try:
        # Connect to Upstash
        print("🔄 Connecting to Upstash Vector...")
        index = Index.from_env()
        print("✅ Connected successfully!")
        
        # Check if foods.json exists
        if not os.path.exists(FOODS_JSON_PATH):
            print(f"❌ {FOODS_JSON_PATH} not found!")
            print("💡 Create a foods.json file in the data/ folder with your food data")
            print("   Example structure:")
            print("   [")
            print("     {")
            print("       \"name\": \"Apple\",")
            print("       \"description\": \"Fresh red apple\",")
            print("       \"country\": \"Australia\",")
            print("       \"calories\": 95,")
            print("       \"nutrition\": \"High in fiber and vitamin C\"")
            print("     }")
            print("   ]")
            return
        
        # Load Foods data
        print(f"\n📝 Loading data from {FOODS_JSON_PATH}...")
        try:
            with open(FOODS_JSON_PATH, "r", encoding="utf-8") as f:
                foods_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in {FOODS_JSON_PATH}: {str(e)}")
            return
        
        print("✅ Foods data loaded successfully!")
        
        # Convert to content chunks
        print("\n🔧 Converting foods to content chunks...")
        content_chunks = create_food_chunks(foods_data)
        print(f"✅ Created {len(content_chunks)} food chunks")
        
        if not content_chunks:
            print("❌ No food items found in the data!")
            return
        
        # Show chunk preview
        print("\n📋 Food Chunks Preview:")
        for i, chunk in enumerate(content_chunks[:5]):
            print(f"  {i+1}. {chunk['title']} ({chunk['type']})")
        if len(content_chunks) > 5:
            print(f"  ... and {len(content_chunks) - 5} more food items")
        
        # Prepare vectors with namespace
        print(f"\n📦 Preparing vectors for '{NAMESPACE}' namespace...")
        vectors = []
        
        for chunk in content_chunks:
            # Create enhanced content for better search
            enhanced_content = f"Food: {chunk['title']}. {chunk['content']}"
            
            vectors.append((
                f"food-{chunk['id']}",
                enhanced_content,
                {
                    "title": chunk['title'],
                    "type": chunk['type'],
                    "category": chunk['category'],
                    "content": chunk['content'],
                    "tags": chunk['tags'],
                    "namespace": NAMESPACE,
                    "source": "foods_data"
                }
            ))
        
        print(f"✅ Prepared {len(vectors)} vectors for upload")
        
        # Upload to Upstash with namespace metadata
        print(f"\n⬆️  Uploading {len(vectors)} vectors to '{NAMESPACE}' namespace...")
        
        # Upload in batches for reliability
        batch_size = 50
        successful_uploads = 0
        
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            try:
                index.upsert(vectors=batch)
                successful_uploads += len(batch)
                print(f"   ✓ Uploaded batch {i//batch_size + 1}: {len(batch)} vectors")
            except Exception as e:
                print(f"   ❌ Batch {i//batch_size + 1} failed: {str(e)}")
        
        print(f"✅ Upload complete! {successful_uploads}/{len(vectors)} vectors uploaded")
        
        # Verify upload
        print(f"\n🔍 Verifying upload...")
        try:
            test_fetch = index.fetch([vectors[0][0]])
            if test_fetch and len(test_fetch) > 0:
                print(f"✅ Verification successful!")
                print(f"   Sample vector: {test_fetch[0].id}")
                print(f"   Namespace: {test_fetch[0].metadata.get('namespace', 'none')}")
            else:
                print("⚠️  Verification inconclusive")
        except Exception as e:
            print(f"⚠️  Could not verify: {str(e)}")
        
        # Final statistics
        print(f"\n📊 Upload Summary:")
        print(f"   Total food items: {len(content_chunks)}")
        print(f"   Vectors uploaded: {successful_uploads}")
        print(f"   Namespace: '{NAMESPACE}'")
        print(f"   ID prefix: 'food-'")
        
        print(f"\n✅ Foods data embedding complete!")
        print(f"💡 Use namespace='{NAMESPACE}' in queries for food-specific searches")
        print(f"🍎 Ready for food RAG queries!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    embed_foods_data()