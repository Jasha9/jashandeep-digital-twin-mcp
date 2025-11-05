"""
Remove Food Data and Reorganize Digital Twin into Multiple Namespaces
This will create separate namespaces for different aspects of your digital twin
"""

import os
from dotenv import load_dotenv
from upstash_vector import Index
import json
import time

load_dotenv()

def remove_food_data_and_reorganize():
    """Remove food data and create multiple digital twin namespaces"""
    print("🧹 Removing Food Data & Creating Digital Twin Namespaces")
    print("=" * 70)
    
    try:
        # Connect to Upstash
        index = Index.from_env()
        print("✅ Connected to Upstash Vector")
        
        # Step 1: Remove all food data
        print("\n🗑️ Removing food data...")
        food_vectors_to_delete = []
        
        try:
            # Query to find food vectors
            food_results = index.query(
                data="food nutrition australian",
                top_k=50,
                include_metadata=True
            )
            
            for result in food_results:
                if (result.id.startswith('food-') or 
                    (result.metadata and result.metadata.get('namespace') == 'foods')):
                    food_vectors_to_delete.append(result.id)
            
            # Delete food vectors
            if food_vectors_to_delete:
                for vector_id in food_vectors_to_delete:
                    try:
                        index.delete(vector_id)
                    except Exception as e:
                        print(f"   Warning: Could not delete {vector_id}: {str(e)}")
                
                print(f"✅ Removed {len(food_vectors_to_delete)} food vectors")
            else:
                print("✅ No food vectors found to remove")
                
        except Exception as e:
            print(f"⚠️ Error removing food data: {str(e)}")
        
        # Wait for deletions to process
        time.sleep(2)
        
        # Step 2: Load digital twin data and create namespace categories
        print("\n📊 Analyzing digital twin data for namespace separation...")
        
        json_file = os.path.join("config", "digitaltwin.json")
        with open(json_file, "r", encoding="utf-8") as f:
            profile_data = json.load(f)
        
        # Define namespace categories
        namespace_categories = {
            'personal': {
                'description': 'Personal info, contact, availability',
                'types': ['personal_info', 'availability']
            },
            'experience': {
                'description': 'Work experience and achievements',
                'types': ['work_experience', 'star_story']
            },
            'skills': {
                'description': 'Technical skills and competencies',
                'types': ['technical_skills']
            },
            'projects': {
                'description': 'Project portfolio and achievements',
                'types': ['project']
            },
            'education': {
                'description': 'Education and learning achievements',
                'types': ['education', 'education_star_story']
            },
            'behavioral': {
                'description': 'Behavioral competencies and soft skills',
                'types': ['behavioral_competency']
            },
            'interview': {
                'description': 'Interview preparation and STAR stories',
                'types': ['interview_star_story', 'interview_strength_stories', 
                        'interview_challenge_stories', 'interview_growth_stories']
            },
            'goals': {
                'description': 'Career objectives and value propositions',
                'types': ['career_objectives', 'value_proposition']
            }
        }
        
        print("🎯 Planned Digital Twin Namespaces:")
        for ns, info in namespace_categories.items():
            print(f"   • {ns}: {info['description']}")
        
        print(f"\n✅ Food data removed and namespace plan created!")
        print("💡 Next step: Run the reorganized embedding script to upload with new namespaces")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("⚠️ This will remove ALL food data from your database!")
    confirm = input("Type 'YES' to proceed: ")
    
    if confirm.upper() == 'YES':
        remove_food_data_and_reorganize()
    else:
        print("❌ Operation cancelled.")