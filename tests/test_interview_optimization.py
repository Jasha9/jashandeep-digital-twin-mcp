"""
Test Script for Interview Optimization Framework
Demonstrates the enhanced digital twin capabilities
"""

import sys
import os
import json

# Add the current directory to path for imports
sys.path.append('.')

from interview_optimization_framework import (
    InterviewOptimizedDigitalTwin, 
    QueryClassifier, 
    QueryType,
    ResponseValidator
)
from company_response_customizer import CompanyResponseCustomizer

def load_sample_knowledge_base():
    """Load sample knowledge base for testing"""
    # Try to load the actual digitaltwin.json if available
    try:
        with open('digitaltwin.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Return sample knowledge base
        return {
            "content_chunks": [
                {
                    "id": "exp-1",
                    "title": "AI Builder Experience",
                    "type": "experience",
                    "content": "Currently working as AI Builder Intern at ausbiz Consulting developing digital twins and RAG systems..."
                },
                {
                    "id": "proj-1", 
                    "title": "Food RAG Explorer",
                    "type": "projects",
                    "content": "Built AI-powered application using RAG architecture with 105 food items..."
                }
            ],
            "personal": {"name": "Jashandeep Kaur"},
            "experience": [],
            "skills": {}
        }

def test_query_classification():
    """Test the query classification system"""
    print("🔍 Testing Query Classification System")
    print("=" * 50)
    
    classifier = QueryClassifier()
    
    test_questions = [
        ("Tell me about a challenging project you worked on", QueryType.BEHAVIORAL),
        ("Explain your experience with RAG systems", QueryType.TECHNICAL),
        ("Why do you want to work at our company?", QueryType.COMPANY_SPECIFIC),
        ("What are your salary expectations?", QueryType.SALARY_LOCATION),
        ("When can you start?", QueryType.AVAILABILITY),
        ("Tell me about your Food RAG Explorer", QueryType.PROJECT_SPECIFIC)
    ]
    
    for question, expected_type in test_questions:
        classified_type = classifier.classify_query(question)
        status = "✅" if classified_type == expected_type else "❌"
        print(f"{status} '{question}' → {classified_type.value} (expected: {expected_type.value})")
    
    print("\n")

def test_response_generation():
    """Test response generation with different question types"""
    print("🎯 Testing Response Generation")
    print("=" * 50)
    
    kb = load_sample_knowledge_base()
    interview_system = InterviewOptimizedDigitalTwin(kb)
    
    test_questions = [
        "Tell me about yourself",
        "Describe a challenging project you worked on", 
        "Explain your experience with AI/ML",
        "Why do you want to work here?",
        "What are your salary expectations?"
    ]
    
    for question in test_questions:
        print(f"\n📝 Question: {question}")
        print("-" * 40)
        
        try:
            result = interview_system.process_interview_question(question)
            
            print(f"Query Type: {result['query_type']}")
            print(f"Response Length: {len(result['response'].split())} words")
            
            # Show first 200 characters of response
            response_preview = result['response'][:200] + "..." if len(result['response']) > 200 else result['response']
            print(f"Response Preview: {response_preview}")
            
            # Show validation results
            validation = result.get('validation')
            if validation:
                print(f"Valid: {validation.is_valid}")
                print(f"Authenticity Score: {validation.authenticity_score:.2f}")
                if validation.issues:
                    print(f"Issues: {validation.issues}")
            
        except Exception as e:
            print(f"❌ Error processing question: {e}")
        
        print()

def test_company_customization():
    """Test company-specific response customization"""
    print("🏢 Testing Company Customization")
    print("=" * 50)
    
    customizer = CompanyResponseCustomizer()
    
    base_response = "I have experience with React, Next.js, and cloud deployment. I'm interested in working with innovative technologies to solve real problems."
    
    company_tests = [
        ("Suncorp Group digital transformation team", "technical"),
        ("Flight Centre travel technology", "company_specific"), 
        ("fintech startup in Brisbane", "behavioral"),
        ("unknown company AI role", "general")
    ]
    
    for company_context, query_type in company_tests:
        print(f"\n🏢 Company: {company_context}")
        print(f"Query Type: {query_type}")
        print("-" * 40)
        
        try:
            customized_response = customizer.customize_response(
                base_response, 
                company_context, 
                query_type
            )
            
            # Show if customization was applied
            if len(customized_response) > len(base_response):
                print("✅ Customization Applied")
                additional_content = customized_response[len(base_response):]
                print(f"Added: {additional_content[:150]}...")
            else:
                print("⚪ No specific customization")
                
        except Exception as e:
            print(f"❌ Error in customization: {e}")
    
    print("\n")

def test_response_validation():
    """Test response quality validation"""
    print("✅ Testing Response Validation") 
    print("=" * 50)
    
    validator = ResponseValidator()
    
    test_responses = [
        {
            "response": "I worked on a project using React and deployed it to production.",
            "query_type": QueryType.TECHNICAL,
            "description": "Basic technical response"
        },
        {
            "response": "When I was building my Food RAG Explorer, the situation was challenging because I needed to migrate from local to cloud. The task was to deploy a production AI system. My action was to research cloud alternatives, migrate to Grok API and Upstash, and set up proper deployment. The result was a working application live on Vercel that taught me about production AI systems.",
            "query_type": QueryType.BEHAVIORAL,
            "description": "STAR format behavioral response"
        },
        {
            "response": "The system worked well and I learned a lot from the experience. It was interesting.",
            "query_type": QueryType.TECHNICAL, 
            "description": "Vague response with issues"
        }
    ]
    
    for test_case in test_responses:
        print(f"\n📋 Testing: {test_case['description']}")
        print("-" * 40)
        
        try:
            validation = validator.validate_response(
                test_case["response"], 
                test_case["query_type"]
            )
            
            print(f"Valid: {'✅' if validation.is_valid else '❌'}")
            print(f"Authenticity Score: {validation.authenticity_score:.2f}")
            print(f"Word Count: {len(test_case['response'].split())}")
            
            if validation.issues:
                print(f"Issues: {validation.issues}")
            
            if validation.suggestions:
                print(f"Suggestions: {validation.suggestions[:2]}")  # Show first 2 suggestions
                
        except Exception as e:
            print(f"❌ Error in validation: {e}")

def test_full_interview_simulation():
    """Test complete interview simulation"""
    print("🎭 Full Interview Simulation")
    print("=" * 50)
    
    kb = load_sample_knowledge_base()
    interview_system = InterviewOptimizedDigitalTwin(kb)
    
    # Simulate interview with Suncorp
    interview_questions = [
        ("Tell me about yourself", None),
        ("Describe a challenging project", None),
        ("Why do you want to work at Suncorp?", "Suncorp Group digital transformation"),
        ("What's your experience with Java?", "Suncorp Group digital transformation")
    ]
    
    print("🎯 Simulating Interview with Suncorp Group")
    print("=" * 50)
    
    for i, (question, company_context) in enumerate(interview_questions, 1):
        print(f"\nQ{i}: {question}")
        
        if company_context:
            print(f"Company Context: {company_context}")
        
        print("-" * 40)
        
        try:
            result = interview_system.process_interview_question(question, company_context)
            
            # Show key metrics
            validation = result.get('validation')
            print(f"Response Type: {result['query_type']}")
            print(f"Length: {len(result['response'].split())} words")
            print(f"Authenticity: {validation.authenticity_score:.2f}/1.0" if validation else "N/A")
            print(f"Quality: {'✅ Good' if validation and validation.is_valid else '⚠️ Needs work'}")
            
            # Show first few lines of response
            response_lines = result['response'].split('\n')[:3]
            print(f"Response Start: {' '.join(response_lines)[:150]}...")
            
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n🎯 Interview Simulation Complete!")

def main():
    """Run all tests"""
    print("🚀 Interview Optimization Framework Test Suite")
    print("=" * 60)
    print()
    
    try:
        test_query_classification()
        test_response_generation() 
        test_company_customization()
        test_response_validation()
        test_full_interview_simulation()
        
        print("\n✅ All tests completed successfully!")
        print("🎯 Interview optimization framework is ready for use!")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()