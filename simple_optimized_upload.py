#!/usr/bin/env python3
"""
Simple Optimized Digital Twin Data Upload for Fast 3-Source Retrieval
"""

import json
import os
import time
from upstash_vector import Index

def load_config():
    """Load configuration from environment"""
    url = os.getenv('UPSTASH_VECTOR_REST_URL')
    token = os.getenv('UPSTASH_VECTOR_REST_TOKEN')
    
    if not url or not token:
        raise ValueError("Missing environment variables")
    
    return Index(url=url, token=token)

def load_digital_twin_data():
    """Load the digital twin data as raw text chunks"""
    with open('config/digitaltwin.json', 'r') as f:
        data = json.load(f)
    
    # Convert to optimized text chunks
    chunks = []
    
    # 1. Personal & Academic Overview (Priority chunk)
    personal = data.get('personal_info', {})
    overview = f"""
JASHANDEEP KAUR - AI BUILDER SPECIALIST & FULL STACK DEVELOPER

ACADEMIC EXCELLENCE:
• Victoria University Student (Final Year)
• GPA: 6.17/7.0 (Outstanding Performance)
• HIGH DISTINCTION in 6 subjects
• Data Analytics for Cyber Security: 96/100 (Exceptional Achievement)
• Mobile Application Development: 83/100
• Rapid learning abilities developed through VU's intensive 4-week block system

PROFESSIONAL EXPERIENCE:
• AI Builder Intern at ausbiz Consulting (Current)
• Full Stack Developer Intern at ausbiz Consulting
• Student Mentor at Victoria University (100+ students)
• Hotel Receptionist (Customer service excellence)

LOCATION: Brisbane, Queensland, Australia
VISA STATUS: Student Visa with full work rights, graduating June 2026
AVAILABILITY: Part-time during semester, full-time from July 2026

ELEVATOR PITCH: {personal.get('elevator_pitch', 'High-achieving final-year IT student with 6.17 GPA and hands-on enterprise AI experience')}
"""
    
    chunks.append({
        'id': 'academic_professional_overview',
        'content': overview,
        'category': 'overview',
        'priority': 'high'
    })
    
    # 2. Technical Skills & Projects
    skills = data.get('technical_skills', {})
    tech_content = f"""
TECHNICAL SKILLS & EXPERTISE:

PROGRAMMING LANGUAGES:
{', '.join(skills.get('programming_languages', ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++']))}

AI/ML TECHNOLOGIES:
{', '.join(skills.get('ai_ml', ['TensorFlow', 'PyTorch', 'RAG Systems', 'Vector Databases']))}

WEB DEVELOPMENT:
{', '.join(skills.get('web_development', ['React', 'Next.js', 'Node.js', 'Express']))}

DATABASES & CLOUD:
{', '.join(skills.get('databases', ['PostgreSQL', 'MongoDB', 'Upstash Vector']))}
{', '.join(skills.get('cloud_devops', ['AWS', 'Vercel', 'Docker']))}

CURRENT PROJECTS:
• Enterprise Digital Twin RAG Systems
• Food RAG Explorer (Production deployment)
• Advanced Analytics Dashboard with A/B Testing
• Anti-hallucination AI Systems

SPECIALIZATIONS: Enterprise AI systems, Digital Twins, RAG implementations, Full-stack development
"""
    
    chunks.append({
        'id': 'technical_skills_projects',
        'content': tech_content,
        'category': 'skills',
        'priority': 'high'
    })
    
    # 3. Behavioral Examples & Achievements
    behavioral_content = """
BEHAVIORAL INTERVIEW EXAMPLES & ACHIEVEMENTS:

LEADERSHIP & PROBLEM SOLVING:
• Led development of digital twin system that processes 100+ queries daily
• Mentored 100+ students at Victoria University, improving academic performance
• Designed anti-hallucination system reducing AI errors by 60%
• Implemented A/B testing framework for enterprise AI applications

RAPID LEARNING & ADAPTATION:
• Completed two intensive 10-week programs (Full Stack + AI Builder) simultaneously
• Mastered enterprise AI technologies including RAG, vector databases, LLM orchestration
• Achieved 96/100 in Data Analytics through intensive study and practical application
• VU's 4-week block system developed exceptional rapid learning abilities

TEAMWORK & COMMUNICATION:
• Cross-functional collaboration in enterprise AI development
• Technical mentoring and knowledge transfer to students
• Customer service excellence in hospitality role
• Effective stakeholder communication across multiple concurrent roles

INNOVATION & TECHNICAL EXCELLENCE:
• Migrated complex AI system from local (Ollama) to cloud architecture (Groq)
• Designed intelligent query processing with performance optimization
• Built production-ready systems with monitoring, analytics, and error handling
• Implemented advanced features like semantic caching and usage tracking

RESULTS ACHIEVED:
• 6.17/7.0 GPA with High Distinction in 6 subjects
• 96/100 in Data Analytics for Cyber Security
• Successfully deployed multiple production AI applications
• 100+ students mentored with positive academic outcomes
"""
    
    chunks.append({
        'id': 'behavioral_achievements',
        'content': behavioral_content,
        'category': 'behavioral',
        'priority': 'high'
    })
    
    return chunks

def upload_chunks(index, chunks):
    """Upload optimized chunks to vector database"""
    print(f"Uploading {len(chunks)} optimized chunks...")
    
    success_count = 0
    for chunk in chunks:
        try:
            vector_data = {
                'id': chunk['id'],
                'data': chunk['content'],
                'metadata': {
                    'category': chunk['category'],
                    'priority': chunk['priority'],
                    'optimized_3_source': True
                },
                'namespace': 'dt'
            }
            
            index.upsert(vectors=[vector_data])
            success_count += 1
            print(f"✅ {chunk['id']} ({chunk['category']})")
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Failed {chunk['id']}: {e}")
    
    return success_count

def verify_upload(index):
    """Test the optimized system"""
    try:
        # Test academic query
        result = index.query(
            data="What is Jashandeep's GPA and academic achievements?",
            top_k=3,
            include_metadata=True
        )
        print(f"✅ Academic query: {len(result)} results")
        
        # Test skills query  
        result = index.query(
            data="What are Jashandeep's technical skills?",
            top_k=3,
            include_metadata=True
        )
        print(f"✅ Skills query: {len(result)} results")

        return True
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    print("🚀 Optimized 3-Source Digital Twin Upload\n")
    
    try:
        index = load_config()
        chunks = load_digital_twin_data()
        
        success_count = upload_chunks(index, chunks)
        print(f"\n📊 Uploaded: {success_count}/{len(chunks)} chunks")
        
        if verify_upload(index):
            print("\n🎉 SUCCESS! Digital Twin optimized for fast 3-source responses!")
            print("✨ Academic excellence (6.17 GPA, 96/100 marks) now highlighted!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()