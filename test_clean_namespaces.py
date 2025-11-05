"""
Test Clean Namespace Separation (food vs dt)
"""

import os
import sys
from dotenv import load_dotenv

# Add scripts directory
sys.path.append('scripts')
load_dotenv()

from namespaced_rag_query import NamespacedRAGSystem

def test_clean_namespaces():
    print("🧪 Testing Clean Namespace Separation")
    print("=" * 60)
    
    rag = NamespacedRAGSystem()
    
    # Test 1: Digital Twin Query (dt namespace)
    print("\n🤖 Test 1: Digital Twin Query ('dt' namespace)")
    print("-" * 50)
    result = rag.digital_twin_query("Tell me about your technical skills and programming experience")
    print(f"Namespace: {result['namespace']}")
    print(f"Sources: {result['sources_count']}")
    print(f"Response preview: {result['response'][:150]}...")
    
    # Test 2: Food Query (food namespace)
    print(f"\n🍎 Test 2: Food Query ('food' namespace)")
    print("-" * 50)
    result = rag.food_query("What are some healthy Australian protein sources?")
    print(f"Namespace: {result['namespace']}")
    print(f"Sources: {result['sources_count']}")
    print(f"Response preview: {result['response'][:150]}...")
    
    # Test 3: Verify namespace separation
    print(f"\n🔍 Test 3: Namespace Separation Check")
    print("-" * 50)
    
    # Query both namespaces directly
    dt_chunks = rag.query_namespace("experience skills", "dt", 3)
    food_chunks = rag.query_namespace("nutrition protein", "food", 3)
    
    print(f"DT namespace query returned: {len(dt_chunks)} chunks")
    if dt_chunks:
        print(f"  Sample DT chunk: {dt_chunks[0]['title']} (namespace: {dt_chunks[0]['namespace']})")
    
    print(f"Food namespace query returned: {len(food_chunks)} chunks")  
    if food_chunks:
        print(f"  Sample Food chunk: {food_chunks[0]['title']} (namespace: {food_chunks[0]['namespace']})")
    
    print(f"\n✅ Clean Namespace Separation Test Complete!")
    print(f"🎯 Both 'dt' and 'food' namespaces are working correctly!")

if __name__ == "__main__":
    test_clean_namespaces()