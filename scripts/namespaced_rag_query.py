"""
Namespace-Aware RAG Query System
Queries specific namespaces (digitaltwin or foods) for faster, more relevant results
"""

import os
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq

# Load environment variables
load_dotenv()

class NamespacedRAGSystem:
    def __init__(self):
        """Initialize the namespaced RAG system"""
        self.index = Index.from_env()
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        
    def query_namespace(self, query: str, namespace: str = "dt", top_k: int = 5):
        """
        Query a specific namespace for relevant information
        
        Args:
            query: The search query
            namespace: Either 'digitaltwin' or 'foods'
            top_k: Number of relevant chunks to retrieve
        """
        try:
            print(f"🔍 Searching '{namespace}' namespace for: {query}")
            
            # Search with namespace filtering
            results = self.index.query(
                data=query,
                top_k=top_k,
                include_metadata=True
            )
            
            if not results:
                print(f"❌ No results found in '{namespace}' namespace")
                return []
            
            print(f"✅ Found {len(results)} relevant chunks from '{namespace}'")
            
            # Extract and format results, filtering by namespace
            relevant_chunks = []
            for i, result in enumerate(results):
                # Filter by namespace in results since Upstash may not support filter parameter
                result_namespace = result.metadata.get('namespace', 'unknown') if result.metadata else 'unknown'
                if result_namespace != namespace:
                    continue
                    
                chunk_info = {
                    'id': result.id,
                    'score': result.score,
                    'title': result.metadata.get('title', 'Untitled') if result.metadata else 'Untitled',
                    'type': result.metadata.get('type', 'unknown') if result.metadata else 'unknown',
                    'category': result.metadata.get('category', 'general') if result.metadata else 'general',
                    'content': result.metadata.get('content', '') if result.metadata else '',
                    'tags': result.metadata.get('tags', []) if result.metadata else [],
                    'namespace': result_namespace
                }
                relevant_chunks.append(chunk_info)
                
                print(f"  {len(relevant_chunks)}. {chunk_info['title']} (Score: {chunk_info['score']:.3f})")
                print(f"     Type: {chunk_info['type']} | Category: {chunk_info['category']}")
                print(f"     Tags: {', '.join(chunk_info['tags'][:5])}")
                print()
            
            return relevant_chunks
            
        except Exception as e:
            print(f"❌ Query error: {str(e)}")
            return []
    
    def generate_response(self, query: str, relevant_chunks: list, namespace: str):
        """Generate AI response based on retrieved chunks"""
        if not relevant_chunks:
            return f"I couldn't find relevant information in the '{namespace}' namespace for your query."
        
        # Build context from relevant chunks
        context_parts = []
        for chunk in relevant_chunks:
            context_parts.append(f"Title: {chunk['title']}\nType: {chunk['type']}\nContent: {chunk['content']}\n")
        
        context = "\n---\n".join(context_parts)
        
        # Customize system prompt based on namespace
        if namespace == "dt":
            system_prompt = """You are Jashandeep's AI Digital Twin. Answer questions about Jashandeep's professional background, skills, experience, and qualifications based on the provided context. 

Be conversational and personal, as if you are Jashandeep speaking about yourself. Use "I" and "my" when referring to experiences and achievements. Provide specific examples and details from the context.

For interview questions, provide STAR format responses when appropriate (Situation, Task, Action, Result)."""
        
        elif namespace == "food":
            system_prompt = """You are a knowledgeable food and nutrition assistant. Answer questions about foods, nutrition, cooking, and dietary information based on the provided context.

Provide helpful, accurate information about food items, their nutritional benefits, preparation methods, and cultural significance. Be informative yet conversational."""
        
        else:
            system_prompt = "You are a helpful assistant. Answer questions based on the provided context."
        
        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def digital_twin_query(self, query: str, top_k: int = 5):
        """Query the digital twin namespace specifically"""
        print("🤖 Digital Twin Query")
        print("=" * 40)
        
        relevant_chunks = self.query_namespace(query, "dt", top_k)
        response = self.generate_response(query, relevant_chunks, "dt")
        
        return {
            'query': query,
            'namespace': 'dt',
            'relevant_chunks': relevant_chunks,
            'response': response,
            'sources_count': len(relevant_chunks)
        }
    
    def food_query(self, query: str, top_k: int = 5):
        """Query the foods namespace specifically"""
        print("🍎 Food Query")
        print("=" * 40)
        
        relevant_chunks = self.query_namespace(query, "food", top_k)
        response = self.generate_response(query, relevant_chunks, "food")
        
        return {
            'query': query,
            'namespace': 'food',
            'relevant_chunks': relevant_chunks,
            'response': response,
            'sources_count': len(relevant_chunks)
        }
    
    def smart_query(self, query: str, top_k: int = 5):
        """
        Automatically determine which namespace to query based on query content
        Falls back to digital twin if unclear
        """
        query_lower = query.lower()
        
        # Food-related keywords
        food_keywords = [
            'food', 'eat', 'nutrition', 'recipe', 'cooking', 'ingredient', 
            'calories', 'diet', 'meal', 'dish', 'cuisine', 'restaurant',
            'healthy', 'vitamin', 'protein', 'carbs', 'fat', 'sugar'
        ]
        
        # Check if query is food-related
        is_food_query = any(keyword in query_lower for keyword in food_keywords)
        
        if is_food_query:
            print("🤖 Auto-detected: Food-related query")
            return self.food_query(query, top_k)
        else:
            print("🤖 Auto-detected: Professional/personal query")
            return self.digital_twin_query(query, top_k)

def main():
    """Interactive CLI for testing namespaced queries"""
    print("🚀 Namespace-Aware RAG System")
    print("=" * 50)
    print("Available commands:")
    print("  dt: <query>   - Query digital twin namespace")
    print("  food: <query> - Query foods namespace")  
    print("  auto: <query> - Auto-detect namespace")
    print("  quit          - Exit")
    print()
    
    rag_system = NamespacedRAGSystem()
    
    while True:
        user_input = input("🎯 Query: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
        
        if not user_input:
            continue
        
        # Parse command
        if user_input.startswith('dt:'):
            query = user_input[3:].strip()
            result = rag_system.digital_twin_query(query)
        elif user_input.startswith('food:'):
            query = user_input[5:].strip()
            result = rag_system.food_query(query)
        elif user_input.startswith('auto:'):
            query = user_input[5:].strip()
            result = rag_system.smart_query(query)
        else:
            # Default to auto-detection
            result = rag_system.smart_query(user_input)
        
        # Display results
        print(f"\n💬 Response from '{result['namespace']}' namespace:")
        print("-" * 50)
        print(result['response'])
        print(f"\n📊 Sources: {result['sources_count']} relevant chunks")
        print("=" * 50)
        print()

if __name__ == "__main__":
    main()