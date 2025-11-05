"""
Quick test of the namespaced RAG system
"""

import os
import sys
from dotenv import load_dotenv

# Add the scripts directory to Python path
sys.path.append('scripts')

# Load environment
load_dotenv()

# Import our RAG system
from namespaced_rag_query import NamespacedRAGSystem

def test_queries():
    print("🧪 Testing Namespaced RAG System")
    print("=" * 50)
    
    rag = NamespacedRAGSystem()
    
    # Test 1: Digital Twin Query
    print("\n🤖 Test 1: Digital Twin Query")
    print("-" * 30)
    result = rag.digital_twin_query("Tell me about your AI Builder internship experience")
    print(f"Response: {result['response'][:200]}...")
    print(f"Sources: {result['sources_count']}")
    
    # Test 2: Food Query  
    print("\n🍎 Test 2: Food Query")
    print("-" * 30)
    result = rag.food_query("What Australian foods are high in protein?")
    print(f"Response: {result['response'][:200]}...")
    print(f"Sources: {result['sources_count']}")
    
    # Test 3: Auto Detection
    print("\n🤖 Test 3: Auto Detection (Technical)")
    print("-" * 30)
    result = rag.smart_query("What programming languages do you know?")
    print(f"Detected namespace: {result['namespace']}")
    print(f"Response: {result['response'][:200]}...")
    print(f"Sources: {result['sources_count']}")
    
    print("\n✅ Testing complete!")

if __name__ == "__main__":
    test_queries()