#!/usr/bin/env python3

import json
import os
from dotenv import load_dotenv
from upstash_vector import Index

load_dotenv()

def check_json_content():
    """Check what content is in digitaltwin.json"""
    print("=== Checking digitaltwin.json content ===")
    
    with open('digitaltwin.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'personal_stories' in data:
        print(f"\n✅ Personal stories found: {len(data['personal_stories'])} stories")
        for key, story in data['personal_stories'].items():
            question = story.get('question', 'No question')
            print(f"  - {key}: {question}")
    else:
        print("\n❌ No personal_stories section found")
    
    if 'content_chunks' in data:
        print(f"\n✅ Content chunks found: {len(data['content_chunks'])} chunks")
        for chunk in data['content_chunks']:
            title = chunk.get('title', 'No title')
            print(f"  - {chunk['id']}: {title}")
    else:
        print("\n❌ No content_chunks section found")

def check_vector_database():
    """Check what's actually in the vector database"""
    print("\n=== Checking vector database content ===")
    
    try:
        index = Index.from_env()
        
        # Test query to see what gets retrieved
        test_queries = [
            "how do you manage multiple roles",
            "tell me about a mentoring story",
            "personal story about time management"
        ]
        
        for query in test_queries:
            print(f"\nQuery: '{query}'")
            results = index.query(data=query, top_k=3, include_metadata=True)
            
            for i, result in enumerate(results):
                print(f"  Result {i+1}:")
                print(f"    ID: {result.id}")
                print(f"    Score: {result.score:.3f}")
                if hasattr(result, 'metadata') and result.metadata:
                    title = result.metadata.get('title', 'N/A')
                    print(f"    Title: {title}")
                    content = result.metadata.get('content', '')
                    print(f"    Content preview: {content[:100]}...")
                print()
                
    except Exception as e:
        print(f"❌ Error querying vector database: {e}")

if __name__ == "__main__":
    check_json_content()
    check_vector_database()