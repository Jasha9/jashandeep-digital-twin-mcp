"""
Digital Twin RAG Application
Based on Binal's production implementation
- Upstash Vector: Built-in embeddings and vector storage
- Groq: Ultra-fast LLM inference
"""

import os
import json
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq

# Load environment variables
load_dotenv()

# Constants
JSON_FILE = "digitaltwin.json"
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
DEFAULT_MODEL = "llama-3.1-8b-instant"

def setup_groq_client():
    """Setup Groq client"""
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY not found in .env file")
        return None
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq client initialized successfully!")
        return client
    except Exception as e:
        print(f"❌ Error initializing Groq client: {str(e)}")
        return None

def setup_vector_database():
    """Setup Upstash Vector database with built-in embeddings"""
    print("🔄 Setting up Upstash Vector database...")
    
    try:
        index = Index.from_env()
        print("✅ Connected to Upstash Vector successfully!")
        
        # Check current vector count
        try:
            info = index.info()
            current_count = getattr(info, 'vector_count', 0)
            print(f"📊 Current vectors in database: {current_count}")
        except:
            current_count = 0
        
        # Check if Digital Twin data exists by trying to fetch one
        dt_exists = False
        try:
            test_fetch = index.fetch(["dt-personal-1"])
            if test_fetch and len(test_fetch) > 0:
                dt_exists = True
                print("✅ Digital Twin data already loaded!")
        except:
            pass
        
        # Load data if Digital Twin data doesn't exist
        if not dt_exists:
            print("📝 Loading your professional profile...")
            
            try:
                with open(JSON_FILE, "r", encoding="utf-8") as f:
                    profile_data = json.load(f)
            except FileNotFoundError:
                print(f"❌ {JSON_FILE} not found!")
                return None
            
            # Prepare vectors from content chunks
            vectors = []
            content_chunks = profile_data.get('content_chunks', [])
            
            if not content_chunks:
                print("❌ No content chunks found in profile data")
                return None
            
            for chunk in content_chunks:
                # Add "dt-" prefix to avoid conflicts with Food RAG data
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
                        "source": "digital_twin"  # Add source tag
                    }
                ))
            
            # Upload vectors
            index.upsert(vectors=vectors)
            print(f"✅ Successfully uploaded {len(vectors)} Digital Twin content chunks!")
            print(f"💡 Using 'dt-' prefix to keep separate from Food RAG data")
        
        return index
        
    except Exception as e:
        print(f"❌ Error setting up database: {str(e)}")
        return None

def query_vectors(index, query_text, top_k=3):
    """Query Upstash Vector for similar vectors - Digital Twin data only"""
    try:
        # Query more results since we'll filter in code
        results = index.query(
            data=query_text,
            top_k=top_k * 3,  # Get more results to filter
            include_metadata=True
        )
        
        # Filter for Digital Twin data only
        dt_results = []
        for result in results:
            # Check if this is a Digital Twin vector
            if hasattr(result, 'id') and result.id and result.id.startswith('dt-'):
                dt_results.append(result)
                if len(dt_results) >= top_k:
                    break
        
        # Debug: print what we got
        if dt_results:
            print(f"📋 Debug: Got {len(dt_results)} Digital Twin results")
            if len(dt_results) > 0:
                first_result = dt_results[0]
                print(f"📋 Debug: First result ID: {first_result.id}")
                if hasattr(first_result, 'metadata'):
                    print(f"📋 Debug: Metadata: {first_result.metadata}")
        else:
            print("📋 Debug: No Digital Twin results found")
            print(f"📋 Debug: Total results: {len(results)}")
            if results and len(results) > 0:
                print(f"📋 Debug: First result ID: {results[0].id}")
        
        return dt_results
    except Exception as e:
        print(f"❌ Error querying vectors: {str(e)}")
        return None

def generate_response_with_groq(client, prompt, model=DEFAULT_MODEL):
    """Generate response using Groq"""
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI digital twin. Answer questions as if you are the person, speaking in first person about your background, skills, and experience."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return completion.choices[0].message.content.strip()
        
    except Exception as e:
        return f"❌ Error generating response: {str(e)}"

def rag_query(index, groq_client, question):
    """Perform RAG query using Upstash Vector + Groq"""
    try:
        # Step 1: Query vector database
        results = query_vectors(index, question, top_k=3)
        
        if not results or len(results) == 0:
            return "I don't have specific information about that topic."
        
        # Step 2: Extract relevant content
        print("\n🧠 Searching your professional profile...")
        
        top_docs = []
        for result in results:
            # Handle different response formats
            metadata = {}
            if hasattr(result, 'metadata') and result.metadata:
                metadata = result.metadata
            elif hasattr(result, 'data') and result.data:
                metadata = result.data
            
            title = metadata.get('title', 'Information')
            content = metadata.get('content', '')
            
            # Get score
            score = result.score if hasattr(result, 'score') else 0.0
            
            print(f"🔹 Found: {title} (Relevance: {score:.3f})")
            
            if content:
                top_docs.append(f"{title}: {content}")
            elif metadata:
                # If no content field, try to construct from metadata
                info_parts = []
                for key, value in metadata.items():
                    if key not in ['id', 'title', 'type', 'category', 'tags'] and value:
                        if isinstance(value, (str, int, float)):
                            info_parts.append(str(value))
                if info_parts:
                    top_docs.append(f"{title}: {' '.join(info_parts)}")
        
        if not top_docs:
            return "I found some information but couldn't extract details. The metadata structure might be different than expected."
        
        print(f"⚡ Generating personalized response...\n")
        
        # Step 3: Generate response with context
        context = "\n\n".join(top_docs)
        prompt = f"""Based on the following information about yourself, answer the question.
Speak in first person as if you are describing your own background.

Your Information:
{context}

Question: {question}

Provide a helpful, professional response:"""
        
        response = generate_response_with_groq(groq_client, prompt)
        return response
    
    except Exception as e:
        return f"❌ Error during query: {str(e)}"

def main():
    """Main application loop"""
    print("🤖 Your Digital Twin - AI Profile Assistant")
    print("=" * 50)
    print("🔗 Vector Storage: Upstash (built-in embeddings)")
    print(f"⚡ AI Inference: Groq ({DEFAULT_MODEL})")
    print("📋 Data Source: Your Professional Profile\n")
    
    # Setup clients
    groq_client = setup_groq_client()
    if not groq_client:
        return
    
    index = setup_vector_database()
    if not index:
        return
    
    print("✅ Your Digital Twin is ready!\n")
    
    # Interactive chat loop
    print("🤖 Chat with your AI Digital Twin!")
    print("Ask questions about your experience, skills, projects, or career goals.")
    print("Type 'exit' to quit.\n")
    
    print("💭 Try asking:")
    print("  - 'Tell me about your work experience'")
    print("  - 'What are your technical skills?'")
    print("  - 'Describe your career goals'")
    print()
    
    while True:
        question = input("You: ")
        if question.lower() in ["exit", "quit"]:
            print("👋 Thanks for chatting with your Digital Twin!")
            break
        
        if question.strip():
            answer = rag_query(index, groq_client, question)
            print(f"🤖 Digital Twin: {answer}\n")

if __name__ == "__main__":
    main()
