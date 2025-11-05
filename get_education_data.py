import os
from upstash_vector import Index
from dotenv import load_dotenv

load_dotenv()

index = Index(
    url=os.getenv('UPSTASH_VECTOR_REST_URL'),
    token=os.getenv('UPSTASH_VECTOR_REST_TOKEN')
)

# Get specific vectors we know contain education data
important_ids = [
    'dt-education_1_25',
    'dt-programming_16', 
    'dt-tech_backend_technologies_18',
    'dt-behavioral_adaptability_and_resilience_1_34'
]

print('📚 FULL EDUCATION & CERTIFICATION CONTENT:')
print('=' * 50)

for vector_id in important_ids:
    try:
        result = index.fetch([vector_id])
        if result:
            vector = result[0]
            metadata = vector.metadata or {}
            content = metadata.get('content', 'No content')
            
            print(f'ID: {vector_id}')
            print(f'Type: {metadata.get("type", "Unknown")}')
            print(f'FULL CONTENT:')
            print(content)
            print('-' * 50)
            print()
    except Exception as e:
        print(f'Error fetching {vector_id}: {e}')

# Also search for certifications specifically  
print('🏆 SEARCHING FOR CERTIFICATIONS...')
cert_results = index.query(
    data='blockstar certification achievement credential',
    top_k=10,
    include_metadata=True
)

for result in cert_results:
    print(f'ID: {result.id} (Score: {result.score:.3f})')
    content = result.metadata.get('content', '') if result.metadata else ''
    if 'blockstar' in content.lower() or 'certification' in content.lower():
        print(f'CERTIFICATION CONTENT: {content}')
        print()