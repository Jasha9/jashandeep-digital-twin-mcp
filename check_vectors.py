import os
from upstash_vector import Index
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Upstash Vector client
try:
    index = Index(
        url=os.getenv('UPSTASH_VECTOR_REST_URL'),
        token=os.getenv('UPSTASH_VECTOR_REST_TOKEN')
    )
    print("✅ Connected to Upstash Vector Database")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit(1)

print("\n🔍 SEARCHING FOR EDUCATIONAL CONTENT...")
print("=" * 60)

# Search for education-related content
education_queries = [
    "university college degree education",
    "masters degree graduate school",
    "edinburgh university scotland",
    "academic achievements excellence",
    "educational background qualifications"
]

found_vectors = []
for query in education_queries:
    try:
        results = index.query(
            data=query,
            top_k=10,
            include_metadata=True
        )
        
        for result in results:
            if result.id not in [v.id for v in found_vectors]:
                found_vectors.append(result)
                
    except Exception as e:
        print(f"Error with query '{query}': {e}")

print(f"Found {len(found_vectors)} unique education-related vectors\n")

# Analyze each vector for incorrect information
incorrect_vectors = []
for i, vector in enumerate(found_vectors):
    print(f"--- VECTOR {i+1} ---")
    print(f"ID: {vector.id}")
    
    metadata = vector.metadata or {}
    content = metadata.get('content', 'No content')
    
    print(f"Content Preview: {content[:200]}...")
    print(f"Type: {metadata.get('type', 'Unknown')}")
    print(f"Category: {metadata.get('category', 'Unknown')}")
    
    # Check for potentially incorrect information
    content_lower = content.lower()
    suspicious_keywords = ['edinburgh', 'university', 'masters', 'degree', 'graduate']
    
    found_keywords = [kw for kw in suspicious_keywords if kw in content_lower]
    
    if found_keywords:
        print(f"🚨 SUSPICIOUS KEYWORDS: {', '.join(found_keywords)}")
        incorrect_vectors.append(vector)
        
        # Show full content if it mentions edinburgh or masters
        if 'edinburgh' in content_lower or 'masters' in content_lower:
            print(f"\n📄 FULL CONTENT:\n{content}")
    
    print("-" * 40)
    print()

print(f"\n🚨 SUMMARY: Found {len(incorrect_vectors)} potentially incorrect vectors")
if incorrect_vectors:
    print("\nVectors to review/delete:")
    for v in incorrect_vectors:
        print(f"- {v.id}")

print("\n" + "=" * 60)