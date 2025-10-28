"""
Embed Digital Twin Data to Upstash Vector
Uploads your professional profile data with 'dt-' prefix
"""

# Essential imports for Digital Twin RAG System
import os
import json
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq

# Install command:
# pip install upstash-vector groq python-dotenv

# Load environment variables
load_dotenv()

# Constants
JSON_FILE = "digitaltwin.json"

def embed_digital_twin():
    """Upload Digital Twin data to Upstash Vector"""
    print("🚀 Digital Twin Data Migration")
    print("=" * 50)
    
    try:
        # Connect to Upstash
        print("🔄 Connecting to Upstash Vector...")
        index = Index.from_env()
        print("✅ Connected successfully!")
        
        # Show current stats
        try:
            info = index.info()
            current_count = getattr(info, 'vector_count', 0)
            print(f"📊 Current total vectors: {current_count}")
        except:
            current_count = 0
        
        # Load Digital Twin data
        print(f"\n📝 Loading data from {JSON_FILE}...")
        try:
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                profile_data = json.load(f)
        except FileNotFoundError:
            print(f"❌ {JSON_FILE} not found!")
            return
        
        # Get content chunks
        content_chunks = profile_data.get('content_chunks', [])
        
        if not content_chunks:
            print("❌ No content_chunks found in digitaltwin.json")
            return
        
        print(f"✅ Found {len(content_chunks)} content chunks")
        
        # Prepare vectors with dt- prefix
        vectors = []
        print("\n📦 Preparing vectors...")
        
        for chunk in content_chunks:
            dt_id = f"dt-{chunk['id']}"
            enriched_text = f"{chunk['title']}: {chunk['content']}"
            
            vectors.append((
                dt_id,
                enriched_text,
                {
                    "title": chunk['title'],
                    "type": chunk['type'],
                    "content": chunk['content'],
                    "category": chunk.get('metadata', {}).get('category', ''),
                    "tags": chunk.get('metadata', {}).get('tags', []),
                    "source": "digital_twin"
                }
            ))
            
            print(f"  ✓ {dt_id}: {chunk['title']}")
        
        # Upload to Upstash
        print(f"\n⬆️  Uploading {len(vectors)} vectors to Upstash...")
        index.upsert(vectors=vectors)
        print("✅ Upload successful!")
        
        # Verify
        print("\n🔍 Verifying upload...")
        try:
            test_fetch = index.fetch([vectors[0][0]])
            if test_fetch and len(test_fetch) > 0:
                print("✅ Verification successful!")
                print(f"   Sample: {test_fetch[0].id}")
        except Exception as e:
            print(f"⚠️  Could not verify: {str(e)}")
        
        # Final stats
        try:
            info = index.info()
            final_count = getattr(info, 'vector_count', 0)
            print(f"\n📊 Final total vectors: {final_count}")
            print(f"   Digital Twin vectors: {len(vectors)}")
            print(f"   Other vectors (Food RAG): {final_count - len(vectors)}")
        except:
            pass
        
        print("\n✅ Digital Twin data successfully embedded!")
        print("💡 All vectors use 'dt-' prefix and 'source=digital_twin' tag")
        print("🎯 You can now run digitaltwin_rag.py to chat with your AI twin!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    embed_digital_twin()
