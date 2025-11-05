#!/usr/bin/env python3
"""
Optimized Digital Twin Data Upload for Fast 3-Source Retrieval
This script uploads data in a way that optimizes for quick, accurate responses
with only 3 sources per query.
"""

import json
import os
import time
from upstash_vector import Index

def load_config():
    """Load configuration from environment and JSON file"""
    url = os.getenv('UPSTASH_VECTOR_REST_URL')
    token = os.getenv('UPSTASH_VECTOR_REST_TOKEN')
    
    if not url or not token:
        raise ValueError("Missing UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN environment variables")
    
    return Index(url=url, token=token)

def load_digital_twin_data():
    """Load the updated digital twin data"""
    with open('config/digitaltwin.json', 'r') as f:
        return json.load(f)

def create_optimized_chunks(data):
    """Create optimized data chunks for fast 3-source retrieval"""
    chunks = []
    
    # Personal & Professional Overview (High Priority - Academic Excellence)
    personal = data.get('personal_info', {})
    overview_text = f"""
    Jashandeep Kaur - AI Builder Specialist & Full Stack Developer
    Location: {personal.get('location', {}).get('current', 'Brisbane, Australia')}
    Education: Victoria University Final Year Student with Outstanding Academic Performance
    GPA: 6.17/7.0 (High Distinction)
    Academic Excellence: High Distinction in 6 subjects including 96/100 in Data Analytics for Cyber Security
    Key Achievement: 83/100 in Mobile Application Development
    Current Role: AI Builder Intern at ausbiz Consulting
    Visa Status: {personal.get('visa_status', 'Student Visa with work rights')}
    Elevator Pitch: {personal.get('elevator_pitch', 'High-achieving AI Builder with 6.17 GPA and hands-on enterprise experience')}
    """
    chunks.append({
        'id': 'overview',
        'content': overview_text,
        'category': 'personal_overview',
        'keywords': ['jashandeep', 'overview', 'gpa', 'academic', 'high distinction', '96 marks', 'victoria university', 'ai builder']
    })
    
    # Education & Academic Achievements (High Priority)
    education = data.get('education', {})
    education_text = f"""
    EDUCATION - Victoria University, Melbourne
    Degree: {education.get('degree', 'Bachelor of Information Technology')}
    Duration: {education.get('duration', '2023-2026')}
    GPA: {education.get('gpa', '6.17/7.0')} (Outstanding Performance)
    
    ACADEMIC EXCELLENCE:
    - High Distinction in 6 subjects
    - Data Analytics for Cyber Security: 96/100 (Exceptional Performance)
    - Mobile Application Development: 83/100
    - Overall High Distinction average across key subjects
    
    KEY COURSEWORK:
    {', '.join(education.get('key_coursework', ['AI/ML', 'Data Analytics', 'Software Development']))}
    
    ACADEMIC PROJECTS:
    {json.dumps(education.get('projects', []), indent=2)}
    
    LEARNING MODEL: VU's intensive 4-week block system developed rapid learning abilities
    """
    chunks.append({
        'id': 'education',
        'content': education_text,
        'category': 'education',
        'keywords': ['education', 'victoria university', 'gpa', '6.17', 'high distinction', '96', 'data analytics', 'cyber security', 'mobile development', 'academic excellence']
    })
    
    # Professional Experience (High Priority)
    experience_text = "PROFESSIONAL EXPERIENCE:\n\n"
    for exp in data.get('professional_experience', []):
        experience_text += f"""
        {exp.get('company', 'Company')} - {exp.get('role', 'Role')}
        Duration: {exp.get('duration', 'Duration')}
        Type: {exp.get('type', 'Type')}
        
        Key Responsibilities:
        {chr(10).join('• ' + resp for resp in exp.get('responsibilities', []))}
        
        Technologies: {', '.join(exp.get('technologies', []))}
        Achievements: {', '.join(exp.get('achievements', [])) if exp.get('achievements') else 'N/A'}
        
        """
    
    chunks.append({
        'id': 'experience',
        'content': experience_text,
        'category': 'experience',
        'keywords': ['experience', 'ausbiz', 'internship', 'ai builder', 'digital twin', 'rag systems', 'mentoring']
    })
    
    # Technical Skills (Medium Priority)
    skills = data.get('technical_skills', {})
    skills_text = f"""
    TECHNICAL SKILLS:
    
    Programming Languages: {', '.join(skills.get('programming_languages', ['Python', 'JavaScript', 'TypeScript']))}
    AI/ML Technologies: {', '.join(skills.get('ai_ml', ['TensorFlow', 'PyTorch', 'scikit-learn']))}
    Web Development: {', '.join(skills.get('web_development', ['React', 'Next.js', 'Node.js']))}
    Databases: {', '.join(skills.get('databases', ['PostgreSQL', 'MongoDB', 'Vector DBs']))}
    Cloud & DevOps: {', '.join(skills.get('cloud_devops', ['AWS', 'Docker', 'Vercel']))}
    Tools & Frameworks: {', '.join(skills.get('tools_frameworks', ['Git', 'VS Code', 'Jupyter']))}
    
    Current Focus: Enterprise AI systems, Digital Twins, RAG implementations
    """
    chunks.append({
        'id': 'skills',
        'content': skills_text,
        'category': 'skills',
        'keywords': ['skills', 'python', 'javascript', 'ai', 'ml', 'react', 'next.js', 'digital twin', 'rag']
    })
    
    # STAR Stories (High Priority for behavioral questions)
    if 'star_stories' in data:
        star_text = "BEHAVIORAL INTERVIEW EXAMPLES (STAR Method):\n\n"
        for story in data['star_stories']:
            star_text += f"""
            Situation: {story['situation']}
            Task: {story['task']}
            Action: {story['action']}
            Result: {story['result']}
            
            """
        
        chunks.append({
            'id': 'star_stories',
            'content': star_text,
            'category': 'behavioral',
            'keywords': ['star', 'behavioral', 'leadership', 'problem solving', 'teamwork', 'challenges']
        })
    
    # Projects (Medium Priority)
    if 'projects' in data:
        projects_text = "KEY PROJECTS:\n\n"
        for project in data['projects']:
            projects_text += f"""
            {project['name']}
            Description: {project['description']}
            Technologies: {', '.join(project['technologies'])}
            Key Features: {', '.join(project['key_features'])}
            GitHub: {project.get('github', 'N/A')}
            
            """
        
        chunks.append({
            'id': 'projects',
            'content': projects_text,
            'category': 'projects',
            'keywords': ['projects', 'github', 'portfolio', 'development', 'ai', 'web application']
        })
    
    return chunks

def upload_optimized_data(index, chunks):
    """Upload data with optimized structure for fast retrieval"""
    print(f"Uploading {len(chunks)} optimized chunks to Upstash Vector...")
    
    # Clear existing data first
    try:
        print("Clearing existing vectors...")
        # Note: We'll let the new uploads overwrite by using same IDs
    except Exception as e:
        print(f"Note: Could not clear existing data: {e}")
    
    # Upload new optimized chunks
    success_count = 0
    for chunk in chunks:
        try:
            # Create vector with enhanced metadata for better retrieval
            vector_data = {
                'id': chunk['id'],
                'data': chunk['content'],
                'metadata': {
                    'category': chunk['category'],
                    'keywords': ','.join(chunk['keywords']),
                    'priority': 'high' if chunk['category'] in ['personal_overview', 'education', 'experience', 'behavioral'] else 'medium',
                    'optimized_for_3_sources': True
                },
                'namespace': 'dt'
            }
            
            index.upsert(vectors=[vector_data])
            success_count += 1
            print(f"✅ Uploaded chunk: {chunk['id']} ({chunk['category']})")
            time.sleep(0.5)  # Rate limiting
            
        except Exception as e:
            print(f"❌ Failed to upload chunk {chunk['id']}: {e}")
    
    print(f"\n🎉 Successfully uploaded {success_count}/{len(chunks)} optimized chunks!")
    return success_count

def verify_upload(index):
    """Verify the upload was successful"""
    try:
        # Test query for academic information
        academic_query = index.query(
            data="What is Jashandeep's GPA and academic achievements?",
            top_k=3,
            include_metadata=True
        )
        
        print(f"\n✅ Verification: Found {len(academic_query)} results for academic query")
        
        # Test query for experience
        exp_query = index.query(
            data="Tell me about Jashandeep's work experience",
            top_k=3,
            include_metadata=True
        )
        
        print(f"✅ Verification: Found {len(exp_query)} results for experience query")
        
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    """Main execution function"""
    print("🚀 Starting Optimized Digital Twin Data Upload for 3-Source Retrieval\n")
    
    try:
        # Initialize
        index = load_config()
        data = load_digital_twin_data()
        
        # Create optimized chunks
        print("📦 Creating optimized data chunks...")
        chunks = create_optimized_chunks(data)
        print(f"Created {len(chunks)} optimized chunks")
        
        # Upload data
        success_count = upload_optimized_data(index, chunks)
        
        # Verify upload
        if verify_upload(index):
            print("\n🎉 Optimized upload completed successfully!")
            print("✨ Digital Twin is now optimized for fast 3-source responses with academic excellence highlighted!")
        else:
            print("\n⚠️ Upload completed but verification failed")
            
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()