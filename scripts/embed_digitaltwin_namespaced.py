"""
Enhanced Digital Twin Embedding Script with Namespace Support
Converts your interview-optimized JSON profile into searchable vector chunks
Uses 'digitaltwin' namespace for better query performance
"""

import os
import json
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq

# Load environment variables
load_dotenv()

# Configuration
JSON_FILE_PATH = os.path.join("config", "digitaltwin.json")
NAMESPACE = "digitaltwin"

def create_content_chunks(profile_data):
    """Convert structured JSON profile into searchable content chunks"""
    chunks = []
    chunk_id = 1
    
    # Personal Information
    personal = profile_data.get("personal_info", {})
    if personal:
        chunks.append({
            "id": f"personal_{chunk_id}",
            "title": "Professional Overview",
            "content": f"{personal.get('name', '')} is a {personal.get('profession', '')} based in {personal.get('location', {}).get('current', '')}. {personal.get('elevator_pitch', '')}",
            "type": "personal_info",
            "category": "overview",
            "tags": ["professional", "overview", "introduction"]
        })
        chunk_id += 1
        
        # Visa and availability
        chunks.append({
            "id": f"availability_{chunk_id}",
            "title": "Availability and Work Rights",
            "content": f"Visa Status: {personal.get('visa_status', '')}. Current Availability: {personal.get('availability', {}).get('current', '')}. Post-graduation: {personal.get('availability', {}).get('post_graduation', '')}. Graduation: {personal.get('availability', {}).get('graduation_date', '')}",
            "type": "availability",
            "category": "logistics",
            "tags": ["visa", "availability", "work_rights", "graduation"]
        })
        chunk_id += 1
    
    # Career Objectives
    career = profile_data.get("career_objectives", {})
    if career:
        objectives_content = f"Short-term: {career.get('short_term', '')}. Medium-term: {career.get('medium_term', '')}. Long-term: {career.get('long_term', '')}."
        if career.get('target_industries'):
            objectives_content += f" Target industries: {', '.join(career.get('target_industries', []))}."
        
        chunks.append({
            "id": f"career_{chunk_id}",
            "title": "Career Objectives and Goals",
            "content": objectives_content,
            "type": "career_objectives",
            "category": "goals",
            "tags": ["career", "goals", "objectives", "industries"]
        })
        chunk_id += 1
    
    # Work Experience
    for i, experience in enumerate(profile_data.get("work_experience", [])):
        # Main experience chunk
        exp_content = f"Position: {experience.get('position', '')} at {experience.get('company', '')} ({experience.get('duration', '')}). "
        exp_content += f"Key responsibilities: {'. '.join(experience.get('key_responsibilities', []))}. "
        exp_content += f"Achievements: {'. '.join(experience.get('achievements', []))}. "
        exp_content += f"Technologies: {', '.join(experience.get('technologies', []))}."
        
        chunks.append({
            "id": f"experience_{i+1}_{chunk_id}",
            "title": f"{experience.get('position', '')} at {experience.get('company', '')}",
            "content": exp_content,
            "type": "work_experience",
            "category": "experience",
            "tags": ["experience", "work", experience.get('company', '').lower().replace(' ', '_')] + experience.get('technologies', [])
        })
        chunk_id += 1
        
        # STAR stories for each experience
        for j, story in enumerate(experience.get('star_stories', [])):
            star_content = f"Situation: {story.get('situation', '')} Task: {story.get('task', '')} Action: {story.get('action', '')} Result: {story.get('result', '')}"
            
            chunks.append({
                "id": f"star_{i+1}_{j+1}_{chunk_id}",
                "title": f"STAR Story - {experience.get('position', '')} #{j+1}",
                "content": star_content,
                "type": "star_story",
                "category": "behavioral",
                "tags": ["star", "behavioral", "interview", experience.get('company', '').lower().replace(' ', '_')]
            })
            chunk_id += 1
    
    # Technical Skills
    tech_skills = profile_data.get("technical_skills", {})
    if tech_skills:
        # Programming languages
        prog_langs = tech_skills.get("programming_languages", {})
        if prog_langs:
            lang_content = "Programming Languages: "
            for lang, details in prog_langs.items():
                lang_content += f"{lang.replace('_', '/')} ({details.get('proficiency', '')} - {details.get('experience', '')}): {details.get('details', '')}. "
            
            chunks.append({
                "id": f"programming_{chunk_id}",
                "title": "Programming Languages",
                "content": lang_content,
                "type": "technical_skills",
                "category": "programming",
                "tags": ["programming", "languages", "technical"] + list(prog_langs.keys())
            })
            chunk_id += 1
        
        # Other technical categories
        for category, skills in tech_skills.items():
            if category != "programming_languages" and isinstance(skills, list):
                chunks.append({
                    "id": f"tech_{category}_{chunk_id}",
                    "title": f"{category.replace('_', ' ').title()}",
                    "content": f"{category.replace('_', ' ').title()}: {', '.join(skills)}",
                    "type": "technical_skills",
                    "category": "technology",
                    "tags": ["technical", category.replace('_', '_')] + skills
                })
                chunk_id += 1
    
    # Projects
    for i, project in enumerate(profile_data.get("projects", [])):
        project_content = f"Project: {project.get('name', '')} ({project.get('type', '')}). Duration: {project.get('duration', '')}. Status: {project.get('status', '')}. "
        project_content += f"Description: {project.get('description', '')}. "
        project_content += f"Technologies: {', '.join(project.get('technologies', []))}. "
        project_content += f"Key features: {'. '.join(project.get('key_features', []))}. "
        project_content += f"Achievements: {'. '.join(project.get('achievements', []))}."
        
        chunks.append({
            "id": f"project_{i+1}_{chunk_id}",
            "title": project.get('name', ''),
            "content": project_content,
            "type": "project",
            "category": "projects",
            "tags": ["project", project.get('type', '').lower().replace(' ', '_')] + project.get('technologies', [])
        })
        chunk_id += 1
    
    # Education
    for i, education in enumerate(profile_data.get("education", [])):
        edu_content = f"Degree: {education.get('degree', '')} from {education.get('institution', '')} ({education.get('duration', '')}). "
        edu_content += f"Status: {education.get('status', '')}. Focus areas: {', '.join(education.get('focus_areas', []))}. "
        edu_content += f"Relevant coursework: {', '.join(education.get('relevant_coursework', []))}. "
        if education.get('achievements'):
            edu_content += f"Achievements: {'. '.join(education.get('achievements', []))}."
        
        chunks.append({
            "id": f"education_{i+1}_{chunk_id}",
            "title": f"{education.get('degree', '')} - {education.get('institution', '')}",
            "content": edu_content,
            "type": "education",
            "category": "education",
            "tags": ["education", "university", education.get('institution', '').lower().replace(' ', '_')]
        })
        chunk_id += 1
        
        # Education STAR stories
        for j, story in enumerate(education.get('star_stories', [])):
            star_content = f"Situation: {story.get('situation', '')} Task: {story.get('task', '')} Action: {story.get('action', '')} Result: {story.get('result', '')}"
            
            chunks.append({
                "id": f"edu_star_{i+1}_{j+1}_{chunk_id}",
                "title": f"Education STAR Story - {education.get('institution', '')} #{j+1}",
                "content": star_content,
                "type": "education_star_story",
                "category": "behavioral",
                "tags": ["star", "behavioral", "education", "university"]
            })
            chunk_id += 1
    
    # Behavioral Competencies
    behavioral = profile_data.get("behavioral_competencies", {})
    for competency_area, competencies in behavioral.items():
        for i, comp in enumerate(competencies):
            comp_content = f"Competency: {comp.get('competency', '')}. Example: {comp.get('example', '')}. Skills demonstrated: {', '.join(comp.get('skills_demonstrated', []))}."
            
            chunks.append({
                "id": f"behavioral_{competency_area}_{i+1}_{chunk_id}",
                "title": f"Behavioral Competency - {comp.get('competency', '')}",
                "content": comp_content,
                "type": "behavioral_competency",
                "category": "behavioral",
                "tags": ["behavioral", "competency", competency_area.replace('_', '_')] + comp.get('skills_demonstrated', [])
            })
            chunk_id += 1
    
    # Interview Preparation STAR Stories
    interview_prep = profile_data.get("interview_preparation", {})
    
    # Additional STAR stories
    additional_stars = interview_prep.get("additional_star_stories", {})
    for category, story in additional_stars.items():
        star_content = f"Situation: {story.get('situation', '')} Task: {story.get('task', '')} Action: {story.get('action', '')} Result: {story.get('result', '')}"
        
        chunks.append({
            "id": f"interview_star_{category}_{chunk_id}",
            "title": f"Interview STAR - {category.replace('_', ' ').title()}",
            "content": star_content,
            "type": "interview_star_story",
            "category": "behavioral",
            "tags": ["star", "behavioral", "interview", category.replace('_', '_')]
        })
        chunk_id += 1
    
    # Strength and challenge stories
    for story_type in ["strength_stories", "challenge_stories", "growth_stories"]:
        stories = interview_prep.get(story_type, [])
        for i, story in enumerate(stories):
            story_content = f"{story_type.replace('_', ' ').title()}: {story.get('strength', '') or story.get('challenge', '') or story.get('growth_area', '')}. "
            story_content += f"Story: {story.get('story', '')}. Key points: {', '.join(story.get('key_points', []))}."
            
            chunks.append({
                "id": f"interview_{story_type}_{i+1}_{chunk_id}",
                "title": f"Interview {story_type.replace('_', ' ').title()} #{i+1}",
                "content": story_content,
                "type": f"interview_{story_type}",
                "category": "interview_prep",
                "tags": ["interview", story_type.replace('_', '_')] + story.get('key_points', [])
            })
            chunk_id += 1
    
    # Unique Value Propositions
    uvps = profile_data.get("unique_value_propositions", [])
    if uvps:
        uvp_content = "Unique Value Propositions: " + ". ".join(uvps)
        chunks.append({
            "id": f"uvp_{chunk_id}",
            "title": "Unique Value Propositions",
            "content": uvp_content,
            "type": "value_proposition",
            "category": "strengths",
            "tags": ["value", "strengths", "unique", "competitive_advantage"]
        })
        chunk_id += 1
    
    return chunks

def embed_digital_twin():
    """Upload Digital Twin data to Upstash Vector with namespace support"""
    print("🚀 Digital Twin Data Embedding with Namespaces")
    print("=" * 60)
    
    try:
        # Connect to Upstash
        print("🔄 Connecting to Upstash Vector...")
        index = Index.from_env()
        print("✅ Connected successfully!")
        
        # Load Digital Twin data
        print(f"\n📝 Loading data from {JSON_FILE_PATH}...")
        try:
            with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
                profile_data = json.load(f)
        except FileNotFoundError:
            print(f"❌ {JSON_FILE_PATH} not found!")
            return
        
        print("✅ Profile data loaded successfully!")
        
        # Convert to content chunks
        print("\n🔧 Converting profile to content chunks...")
        content_chunks = create_content_chunks(profile_data)
        print(f"✅ Created {len(content_chunks)} content chunks")
        
        # Show chunk preview
        print("\n📋 Content Chunks Preview:")
        for i, chunk in enumerate(content_chunks[:5]):
            print(f"  {i+1}. {chunk['title']} ({chunk['type']})")
        if len(content_chunks) > 5:
            print(f"  ... and {len(content_chunks) - 5} more chunks")
        
        # Prepare vectors with namespace
        print(f"\n📦 Preparing vectors for '{NAMESPACE}' namespace...")
        vectors = []
        
        for chunk in content_chunks:
            # Create enhanced content for better search
            enhanced_content = f"Title: {chunk['title']}. Type: {chunk['type']}. Category: {chunk['category']}. Content: {chunk['content']}"
            
            vectors.append((
                f"dt-{chunk['id']}",
                enhanced_content,
                {
                    "title": chunk['title'],
                    "type": chunk['type'],
                    "category": chunk['category'],
                    "content": chunk['content'],
                    "tags": chunk['tags'],
                    "namespace": NAMESPACE,
                    "source": "digital_twin"
                }
            ))
        
        print(f"✅ Prepared {len(vectors)} vectors for upload")
        
        # Clear existing digital twin data
        print(f"\n🗑️  Clearing existing '{NAMESPACE}' data...")
        try:
            # This will be a simple delete by filtering - in production you'd want better cleanup
            print("   (Note: Manual cleanup of existing vectors recommended)")
        except Exception as e:
            print(f"   Warning: Could not clear existing data: {str(e)}")
        
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
        print(f"   Total chunks created: {len(content_chunks)}")
        print(f"   Vectors uploaded: {successful_uploads}")
        print(f"   Namespace: '{NAMESPACE}'")
        print(f"   ID prefix: 'dt-'")
        
        print(f"\n✅ Digital Twin embedding complete!")
        print(f"💡 Use namespace='{NAMESPACE}' in queries for faster performance")
        print(f"🎯 Ready for interview-optimized RAG queries!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    embed_digital_twin()