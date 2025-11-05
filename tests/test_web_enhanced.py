#!/usr/bin/env python3
"""
Test Enhanced RAG Web Interface
Tests the complete enhanced RAG functionality through the web API
"""

import requests
import json
import time
import sys

def test_enhanced_web_interface():
    """Test the enhanced RAG functionality through the web API"""
    print("🧪 Testing Enhanced RAG Web Interface")
    print("=" * 50)
    
    base_url = "http://localhost:3000"
    api_endpoint = f"{base_url}/api/digital-twin"
    
    # Test question for technical interview
    test_question = "I have an interview for a Senior Full Stack Developer role that requires React, Node.js, and team leadership. How should I position my background?"
    
    try:
        # Test Enhanced RAG
        print("🚀 Testing Enhanced RAG...")
        enhanced_payload = {
            "question": test_question,
            "useEnhanced": True
        }
        
        start_time = time.time()
        enhanced_response = requests.post(
            api_endpoint,
            json=enhanced_payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        enhanced_time = time.time() - start_time
        
        if enhanced_response.status_code == 200:
            enhanced_data = enhanced_response.json()
            print(f"✅ Enhanced RAG Response (Status: {enhanced_response.status_code})")
            print(f"📊 Interview Type: {enhanced_data.get('interviewType', 'Unknown')}")
            print(f"⏱️ Total Time: {enhanced_data.get('totalTime', 'Unknown')}ms")
            print(f"🔄 Processing Time: {enhanced_time:.2f}s")
            print(f"📝 Response Length: {len(enhanced_data.get('response', ''))}")
            print(f"💡 Response Preview: {enhanced_data.get('response', '')[:200]}...")
            print()
        else:
            print(f"❌ Enhanced RAG Failed (Status: {enhanced_response.status_code})")
            print(f"Error: {enhanced_response.text}")
            return False
        
        # Test Basic RAG for comparison
        print("🔄 Testing Basic RAG for comparison...")
        basic_payload = {
            "question": test_question,
            "useEnhanced": False
        }
        
        start_time = time.time()
        basic_response = requests.post(
            api_endpoint,
            json=basic_payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        basic_time = time.time() - start_time
        
        if basic_response.status_code == 200:
            basic_data = basic_response.json()
            print(f"✅ Basic RAG Response (Status: {basic_response.status_code})")
            print(f"⏱️ Processing Time: {basic_time:.2f}s")
            print(f"📝 Response Length: {len(basic_data.get('response', ''))}")
            print(f"💡 Response Preview: {basic_data.get('response', '')[:200]}...")
            print()
        else:
            print(f"❌ Basic RAG Failed (Status: {basic_response.status_code})")
            print(f"Error: {basic_response.text}")
        
        # Performance Comparison
        print("📊 Performance Comparison:")
        print(f"Enhanced RAG: {enhanced_time:.2f}s ({len(enhanced_data.get('response', ''))} chars)")
        print(f"Basic RAG: {basic_time:.2f}s ({len(basic_data.get('response', ''))} chars)")
        
        enhancement_factor = enhanced_time / basic_time if basic_time > 0 else 0
        print(f"Speed Factor: {enhancement_factor:.1f}x slower (expected for LLM processing)")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure Next.js server is running on localhost:3000")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: Request took too long")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    print("🌟 Enhanced Digital Twin Web Interface Test")
    print("Testing complete enhanced RAG functionality through web API")
    print()
    
    success = test_enhanced_web_interface()
    
    if success:
        print("🎉 Enhanced RAG Web Interface Test PASSED!")
        print("✨ System is ready for advanced interview preparation!")
    else:
        print("💥 Test FAILED - Check server status and configuration")
        sys.exit(1)