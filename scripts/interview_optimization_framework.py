"""
Interview Optimization Framework for Digital Twin
Implements query classification, STAR format responses, and validation system
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
import json
from dataclasses import dataclass

class QueryType(Enum):
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical" 
    PROJECT_SPECIFIC = "project_specific"
    COMPANY_SPECIFIC = "company_specific"
    SALARY_LOCATION = "salary_location"
    AVAILABILITY = "availability"
    PERSONAL_STORY = "personal_story"
    GENERAL = "general"

@dataclass
class STARResponse:
    situation: str
    task: str
    action: str
    result: str
    lessons_learned: Optional[str] = None

@dataclass
class ValidationResult:
    is_valid: bool
    issues: List[str]
    suggestions: List[str]
    authenticity_score: float

class QueryClassifier:
    """Classifies interview questions into appropriate categories"""
    
    def __init__(self):
        self.behavioral_patterns = [
            r"tell me about (a time|when|yourself)",
            r"describe (a situation|an experience|how you)",
            r"give me an example",
            r"walk me through",
            r"how do you (handle|deal with|approach)",
            r"what would you do if",
            r"challenging (project|situation|experience)",
            r"difficult (customer|situation|decision)",
            r"conflict|disagreement|problem",
            r"leadership|mentor|team",
            r"failure|mistake|learn from",
            r"strength|weakness|improve",
            r"motivation|passion|drive"
        ]
        
        self.technical_patterns = [
            r"explain (your experience with|how.*works?)",
            r"what is|how does.*work",
            r"difference between",
            r"implement|build|develop|code",
            r"algorithm|data structure",
            r"database|API|framework",
            r"deployment|cloud|architecture",
            r"testing|debugging|optimization",
            r"RAG|AI|ML|vector|embedding",
            r"React|Next\.js|Python|JavaScript",
            r"full.?stack|frontend|backend"
        ]
        
        self.project_patterns = [
            r"Food RAG Explorer",
            r"digital twin|personal digital twin",
            r"full.?stack.*application",
            r"portfolio|github|project",
            r"internship.*project",
            r"ausbiz.*project"
        ]
        
        self.company_patterns = [
            r"why.*company|why.*us",
            r"what do you know about",
            r"research.*company",
            r"fit.*culture|culture.*fit",
            r"contribute.*team|add.*value"
        ]
        
        self.salary_patterns = [
            r"salary|compensation|pay|money",
            r"expectations.*salary",
            r"budget|rate|cost",
            r"relocate|location|remote|hybrid",
            r"visa|authorization|eligibility"
        ]
        
        self.availability_patterns = [
            r"start date|when.*start|availability",
            r"notice.*period|current.*job",
            r"graduate|graduation|finish.*degree",
            r"part.?time|full.?time|hours.*week"
        ]
    
    def classify_query(self, question: str) -> QueryType:
        """Classify a question into the most appropriate category"""
        question_lower = question.lower()
        
        # Check for behavioral patterns
        if any(re.search(pattern, question_lower) for pattern in self.behavioral_patterns):
            return QueryType.BEHAVIORAL
        
        # Check for technical patterns
        if any(re.search(pattern, question_lower) for pattern in self.technical_patterns):
            return QueryType.TECHNICAL
        
        # Check for project-specific patterns
        if any(re.search(pattern, question_lower) for pattern in self.project_patterns):
            return QueryType.PROJECT_SPECIFIC
        
        # Check for company-specific patterns
        if any(re.search(pattern, question_lower) for pattern in self.company_patterns):
            return QueryType.COMPANY_SPECIFIC
        
        # Check for salary/location patterns
        if any(re.search(pattern, question_lower) for pattern in self.salary_patterns):
            return QueryType.SALARY_LOCATION
        
        # Check for availability patterns
        if any(re.search(pattern, question_lower) for pattern in self.availability_patterns):
            return QueryType.AVAILABILITY
        
        return QueryType.GENERAL

class ResponseTemplateGenerator:
    """Generates structured responses based on query type"""
    
    def __init__(self, knowledge_base: Dict):
        self.knowledge_base = knowledge_base
        
    def generate_behavioral_response(self, question: str, context: List[Dict]) -> str:
        """Generate STAR format response for behavioral questions"""
        
        # Extract relevant experience from context
        experiences = [item for item in context if item.get('type') in ['experience', 'personal_story']]
        
        # Map common behavioral questions to specific experiences
        question_lower = question.lower()
        
        if any(keyword in question_lower for keyword in ['challenging', 'difficult', 'problem']):
            return self._format_challenging_project_response()
        elif any(keyword in question_lower for keyword in ['learn', 'technology', 'quickly']):
            return self._format_learning_response()
        elif any(keyword in question_lower for keyword in ['balance', 'multiple', 'responsibilities']):
            return self._format_time_management_response()
        elif any(keyword in question_lower for keyword in ['mentor', 'help', 'explain']):
            return self._format_mentoring_response()
        elif any(keyword in question_lower for keyword in ['tell me about yourself', 'background']):
            return self._format_introduction_response()
        else:
            return self._format_generic_behavioral_response(experiences)
    
    def _format_challenging_project_response(self) -> str:
        return """My Food RAG Explorer project presented a significant technical challenge that pushed my abilities.

**Situation:** I built an AI application locally using Ollama and ChromaDB, but needed to migrate it to production for real-world use - something I'd never done before.

**Task:** Transition from local development to cloud deployment while maintaining functionality and learning production-grade AI architecture along the way.

**Action:** I systematically researched and implemented cloud alternatives: migrated from Ollama to Grok API, ChromaDB to Upstash vector database, designed the interface with V0.dev, and deployed on Vercel. I broke down each component and tackled them individually.

**Result:** Successfully deployed a live AI application and gained deep understanding of RAG systems, vector embeddings, and production deployment pipelines. This experience taught me that complex challenges become manageable through systematic breakdown and persistent problem-solving."""

    def _format_learning_response(self) -> str:
        return """Great question! This actually happened during my Full Stack Developer internship with ausbiz Consulting, which was a 10-week intensive program.

**Situation:** I had some basic coding knowledge from university, but I hadn't worked with modern production frameworks like React 19, Next.js 15, or cloud deployment before. The program was fast-paced, and we were expected to build and deploy real applications within those 10 weeks.

**Task:** I needed to quickly master these technologies to successfully complete the program and build production-ready applications.

**Action:** I adopted a very hands-on learning approach. I'd watch the training materials, but then immediately apply what I learned by building small features. I also made heavy use of GitHub Copilot and ChatGPT - not just to write code, but to understand *why* the code worked that way. When I got stuck, I'd ask specific questions rather than broad ones. For example, when learning about server-side rendering in Next.js, I didn't just read about it - I built a small feature that required SSR, broke it, and fixed it. That's how the concepts really stuck.

**Result:** By the end of those 10 weeks, I had built multiple full-stack applications with React 19 and Next.js 15, integrated PostgreSQL databases with Prisma ORM, worked with AWS cloud services, and deployed production-ready applications to Vercel. I also earned my Full Stack Developer certification. This experience taught me that I thrive in intensive learning environments, and that I'm capable of picking up new technologies quickly when I combine structured learning with hands-on practice."""

    def _format_time_management_response(self) -> str:
        return """This is something I actually deal with every day! Right now, I'm managing my AI Builder internship, working as a Student Tutor and Mentor at Victoria University, working part-time as a Front Office Receptionist at Royal Albert Hotel, and completing my final year of studies.

**Situation:** I needed to balance four significant commitments while maintaining quality in all areas and meeting everyone's expectations.

**Task:** The challenge was finding a way to manage these responsibilities without burning out or compromising on quality in any area.

**Action:** The key is that these roles actually fit together quite naturally. My mentoring role is most demanding during new student intakes - orientation periods at the start of semester. Those periods usually coincide with my university vacation breaks, when I'm authorized to work full-time on my student visa. My receptionist job is part-time evening shifts, which works perfectly because it doesn't conflict with my day-time university schedule or tutoring sessions. My internship is remote, so I don't lose time commuting. I use strategic scheduling, clear communication with all supervisors, and prioritization based on deadlines and impact.

**Result:** I've successfully maintained all commitments while achieving a 6.17/7.0 GPA, supporting 100+ students, and completing intensive internship programs. What I've learned is that it's not just about being busy - it's about being intentional with your time. Each role actually complements the others - tutoring improves my technical communication, hospitality strengthens customer service skills, and internships provide real-world experience to share with students."""

    def _format_mentoring_response(self) -> str:
        return """I have a story that really shows how I approach this. I had a student who was struggling with our university's LMS system. She kept saying she was 'bad with technology' and getting frustrated every time she tried to navigate it.

**Situation:** A student was struggling with the university's Learning Management System and was getting increasingly frustrated, convinced she was 'bad with technology.'

**Task:** I needed to help her understand the system in a way that would build her confidence and create lasting understanding, not just solve the immediate problem.

**Action:** Instead of just walking her through the steps again, I sat down and asked her about how she organizes things at home. She told me she's really good at organizing her house - everything has a place, and her kids always come to her when they can't find something. So I reframed the LMS as being like organizing a house. I said 'Think of each subject as a different room. Just like you have a kitchen for cooking and a bedroom for sleeping, each subject has its own space with everything you need for that class.' I showed her how the discussion forums were like the living room where everyone gathers to talk, and the assignment submissions were like a filing cabinet.

**Result:** Suddenly, it all clicked for her. She wasn't bad with technology - she just needed a framework that made sense to her world. Now she's one of the most active students on the platform and even helps other students navigate it. That experience taught me that when someone doesn't understand a concept, it's usually not because they're incapable. It's because I haven't found the right way to connect it to something they already know."""

    def _format_introduction_response(self) -> str:
        return """I'm Jashandeep, a final-year IT student at Victoria University Brisbane with hands-on experience in full-stack development and AI systems.

I've completed two internships with ausbiz Consulting - first as a Full Stack Developer building React and Next.js applications, and currently as an AI Builder developing digital twins and RAG systems. My standout project is the Food RAG Explorer, which I successfully migrated from local development to production using Grok API and Upstash.

I also tutor and mentor over 100 students at university, which has sharpened my ability to communicate complex technical concepts clearly. I'm passionate about creating solutions that make a real impact, and I'm looking forward to contributing that same energy to your team."""

    def _format_generic_behavioral_response(self, experiences: List[Dict]) -> str:
        """Format a generic behavioral response using available experiences"""
        if experiences:
            exp = experiences[0]
            return f"Let me share an example from my experience at {exp.get('company', 'my recent work')}...\n\n{exp.get('content', '')}"
        return "I'd be happy to share an example from my experience..."

    def generate_technical_response(self, question: str, context: List[Dict]) -> str:
        """Generate technical response with explanations and examples"""
        
        question_lower = question.lower()
        
        if 'rag' in question_lower:
            return self._format_rag_explanation()
        elif any(term in question_lower for term in ['full stack', 'full-stack']):
            return self._format_fullstack_explanation()
        elif any(term in question_lower for term in ['deploy', 'cloud', 'vercel']):
            return self._format_deployment_explanation()
        elif any(term in question_lower for term in ['ai', 'ml', 'artificial intelligence']):
            return self._format_ai_ml_explanation()
        else:
            return self._format_generic_technical_response(context)

    def _format_rag_explanation(self) -> str:
        return """RAG - Retrieval-Augmented Generation - combines AI models with custom data retrieval for more accurate, context-aware responses.

I implemented this in my Food RAG Explorer project with 105 food items. The system converts both the data and user queries into vector embeddings, performs similarity searches to find relevant information, then feeds that context to the AI model. This grounds responses in actual data rather than just general AI knowledge.

I successfully migrated this from a local ChromaDB setup to production using Upstash vector database and Grok API, which taught me valuable lessons about scaling AI applications for real-world use."""

    def _format_fullstack_explanation(self) -> str:
        return """I've gained solid full-stack experience through my internship at ausbiz Consulting, working with modern JavaScript technologies.

Frontend: React 19 and Next.js 15 with Tailwind CSS. I particularly value Next.js for its flexibility between server-side and client-side rendering, and TypeScript for maintaining code quality across the entire application.

Backend: I build APIs using Next.js App Router and Node.js, with PostgreSQL and Prisma ORM for database management. I've implemented authentication, RESTful APIs, and worked with vector databases like Upstash for AI features.

Deployment: All my applications are deployed on Vercel with proper environment variable management and production optimization. The tight integration between TypeScript, Prisma, and Next.js creates a really efficient development workflow."""

    def _format_deployment_explanation(self) -> str:
        return """I have strong experience deploying applications to Vercel, with a focus on smooth CI/CD workflows and security best practices.

My approach involves connecting GitHub repositories to Vercel for automatic deployments on each push, with proper environment variable configuration for sensitive data like API keys and database connections. For my Food RAG Explorer project, this included integrating Upstash vector database and Grok API.

Key practices I follow: secure environment variable management, thorough testing before deployment, monitoring deployment logs, and implementing preview deployments for testing changes. Vercel's Git integration streamlines the entire process, allowing me to focus on development rather than infrastructure management."""

    def _format_ai_ml_explanation(self) -> str:
        return """I've had some really exciting hands-on experience with AI/ML integration, particularly through my internships with ausbiz Consulting.

During my AI Builder internship, I'm working on enterprise-grade digital twin implementations. This involves creating AI systems that can represent real-world entities and processes using advanced AI architectures, vector embeddings, and RAG systems.

For my Food RAG Explorer project, I integrated multiple AI components:
- Started with Ollama running locally for development, which gave me understanding of how LLMs work
- Migrated to Grok API for production deployment
- Implemented vector embeddings to convert food information into numerical representations
- Set up a vector database (moved from ChromaDB to Upstash) to store and retrieve embeddings efficiently
- Created the RAG pipeline that retrieves relevant information and augments the AI's responses

What I've learned is that AI integration is about more than just calling an API. It's about:
1. Understanding the problem: What's the best AI approach for this specific use case?
2. Data preparation: Making sure your data is in the right format
3. Prompt engineering: Crafting effective prompts to get quality responses
4. Error handling: AI responses can be unpredictable, so you need good fallbacks
5. User experience: How do you present AI outputs in a way that's helpful and trustworthy?

I'm really excited about this field because it's moving so fast. I stay current by using tools like GitHub Copilot and Claude Desktop in my development workflow, which has also taught me a lot about working effectively with AI assistants."""

    def _format_generic_technical_response(self, context: List[Dict]) -> str:
        """Format a generic technical response based on context"""
        tech_skills = [item for item in context if item.get('type') == 'skills']
        if tech_skills:
            return f"Based on my experience, {tech_skills[0].get('content', '')}"
        return "I'd be happy to discuss my technical experience..."

class ResponseValidator:
    """Validates response quality and authenticity"""
    
    def validate_response(self, response: str, query_type: QueryType) -> ValidationResult:
        """Comprehensive validation of response quality"""
        issues = []
        suggestions = []
        
        # Check first-person perspective
        if not self._has_first_person_perspective(response):
            issues.append("Response lacks first-person perspective")
            suggestions.append("Use 'I', 'my', 'me' to personalize the response")
        
        # Check for specificity
        if not self._has_specific_details(response):
            issues.append("Response lacks specific details")
            suggestions.append("Add specific examples, numbers, or concrete details")
        
        # Check length appropriateness
        length_issue = self._check_response_length(response, query_type)
        if length_issue:
            issues.append(length_issue)
            suggestions.append("Adjust response length to match question complexity")
        
        # Check for STAR format in behavioral responses
        if query_type == QueryType.BEHAVIORAL:
            if not self._has_star_structure(response):
                issues.append("Behavioral response missing STAR structure")
                suggestions.append("Include Situation, Task, Action, Result elements")
        
        # Check authenticity
        authenticity_score = self._calculate_authenticity_score(response)
        
        # Check for hallucination indicators
        hallucination_issues = self._check_for_hallucinations(response)
        issues.extend(hallucination_issues)
        
        return ValidationResult(
            is_valid=len(issues) == 0,
            issues=issues,
            suggestions=suggestions,
            authenticity_score=authenticity_score
        )
    
    def _has_first_person_perspective(self, response: str) -> bool:
        """Check if response uses first-person perspective"""
        first_person_indicators = ['I ', 'my ', 'me ', 'myself', "I'm ", "I've "]
        return any(indicator in response for indicator in first_person_indicators)
    
    def _has_specific_details(self, response: str) -> bool:
        """Check for specific details and concrete examples"""
        # Look for numbers, specific technologies, dates, company names
        specific_patterns = [
            r'\d+',  # Numbers
            r'React|Next\.js|Python|JavaScript|Vercel|AWS',  # Technologies
            r'ausbiz|Victoria University|Food RAG Explorer',  # Specific names
            r'\b\d{4}\b',  # Years
            r'weeks?|months?|days?'  # Time periods
        ]
        return any(re.search(pattern, response) for pattern in specific_patterns)
    
    def _check_response_length(self, response: str, query_type: QueryType) -> Optional[str]:
        """Check if response length is appropriate for query type"""
        word_count = len(response.split())
        
        if query_type == QueryType.BEHAVIORAL:
            if word_count < 80:
                return "Behavioral response too short (should be 120-200 words)"
            elif word_count > 250:
                return "Behavioral response too long (should be 120-200 words)"
        elif query_type == QueryType.TECHNICAL:
            if word_count < 60:
                return "Technical response too short (should be 80-150 words)"
            elif word_count > 200:
                return "Technical response too long (should be 80-150 words)"
        
        return None
    
    def _has_star_structure(self, response: str) -> bool:
        """Check if behavioral response follows STAR structure"""
        star_indicators = ['situation', 'task', 'action', 'result']
        response_lower = response.lower()
        
        # Look for explicit STAR markers or implicit structure
        explicit_markers = sum(1 for indicator in star_indicators if indicator in response_lower)
        
        # Look for implicit STAR structure (story flow)
        has_context = any(phrase in response_lower for phrase in ['when i', 'during my', 'at the time'])
        has_challenge = any(phrase in response_lower for phrase in ['needed to', 'had to', 'challenge was'])
        has_action = any(phrase in response_lower for phrase in ['i did', 'i implemented', 'i decided'])
        has_outcome = any(phrase in response_lower for phrase in ['result', 'outcome', 'success', 'learned'])
        
        return explicit_markers >= 2 or (has_context and has_challenge and has_action and has_outcome)
    
    def _calculate_authenticity_score(self, response: str) -> float:
        """Calculate authenticity score based on personal details and specificity"""
        score = 0.0
        
        # Check for personal experiences
        personal_indicators = ['my experience', 'when I', 'I worked', 'I built', 'I learned']
        score += sum(0.2 for indicator in personal_indicators if indicator in response)
        
        # Check for specific details
        if self._has_specific_details(response):
            score += 0.3
        
        # Check for emotional honesty
        honest_indicators = ['challenging', 'difficult', 'learned', 'mistake', 'improved']
        score += sum(0.1 for indicator in honest_indicators if indicator in response)
        
        # Check for conversational tone
        if any(phrase in response for phrase in ["I'd", "that's", "it's", "really"]):
            score += 0.2
        
        return min(1.0, score)
    
    def _check_for_hallucinations(self, response: str) -> List[str]:
        """Check for potential hallucinations or inaccurate information"""
        issues = []
        
        # Check for inconsistent company names
        known_companies = ['ausbiz Consulting', 'Victoria University', 'Royal Albert Hotel']
        if 'Google' in response or 'Microsoft' in response or 'Amazon' in response:
            if not any(company in response for company in known_companies):
                issues.append("Potential hallucination: Unknown company mentioned")
        
        # Check for impossible timeframes
        if re.search(r'(\d+)\s*years? of experience', response):
            issues.append("Check experience timeframe accuracy")
        
        return issues

class InterviewOptimizedDigitalTwin:
    """Main class orchestrating the interview optimization system"""
    
    def __init__(self, knowledge_base: Dict):
        self.knowledge_base = knowledge_base
        self.classifier = QueryClassifier()
        self.template_generator = ResponseTemplateGenerator(knowledge_base)
        self.validator = ResponseValidator()
        
    def process_interview_question(self, question: str, company_context: Optional[str] = None) -> Dict[str, Any]:
        """Process an interview question and generate optimized response"""
        
        # Step 1: Classify the query
        query_type = self.classifier.classify_query(question)
        
        # Step 2: Extract relevant context
        context = self._extract_relevant_context(question, query_type)
        
        # Step 3: Generate response based on type
        if query_type == QueryType.BEHAVIORAL:
            response = self.template_generator.generate_behavioral_response(question, context)
        elif query_type == QueryType.TECHNICAL:
            response = self.template_generator.generate_technical_response(question, context)
        else:
            response = self._generate_contextual_response(question, query_type, context)
        
        # Step 4: Add company-specific customization
        if company_context:
            response = self._customize_for_company(response, company_context)
        
        # Step 5: Validate response
        validation = self.validator.validate_response(response, query_type)
        
        return {
            "question": question,
            "query_type": query_type.value,
            "response": response,
            "validation": validation,
            "context_used": [item.get('title', 'Unknown') for item in context],
            "company_context": company_context
        }
    
    def _extract_relevant_context(self, question: str, query_type: QueryType) -> List[Dict]:
        """Extract relevant context from knowledge base"""
        content_chunks = self.knowledge_base.get('content_chunks', [])
        
        # Filter by query type
        relevant_types = {
            QueryType.BEHAVIORAL: ['experience', 'personal_story', 'strengths'],
            QueryType.TECHNICAL: ['skills', 'projects', 'education'],
            QueryType.PROJECT_SPECIFIC: ['projects'],
            QueryType.SALARY_LOCATION: ['salary_location', 'availability'],
            QueryType.AVAILABILITY: ['availability'],
            QueryType.COMPANY_SPECIFIC: ['career', 'strengths'],
        }
        
        target_types = relevant_types.get(query_type, ['experience', 'skills'])
        
        # Filter chunks by type and relevance
        relevant_chunks = [
            chunk for chunk in content_chunks 
            if chunk.get('type') in target_types
        ]
        
        return relevant_chunks[:3]  # Limit to top 3 most relevant
    
    def _generate_contextual_response(self, question: str, query_type: QueryType, context: List[Dict]) -> str:
        """Generate contextual response for non-behavioral, non-technical queries"""
        
        if query_type == QueryType.SALARY_LOCATION:
            return self._format_salary_location_response()
        elif query_type == QueryType.AVAILABILITY:
            return self._format_availability_response()
        elif query_type == QueryType.COMPANY_SPECIFIC:
            return self._format_company_interest_response()
        else:
            # Use first relevant context item
            if context:
                return context[0].get('content', '')
            return "I'd be happy to discuss that with you."
    
    def _format_salary_location_response(self) -> str:
        return """I'm flexible on compensation and really interested in finding the right fit. Based on my research of Brisbane market rates and considering my technical skills in AI/ML and full-stack development, I'm thinking in the range of $65,000 to $75,000 for an entry-level developer role, with potential for a premium for specialized AI/ML positions up to $85,000.

What's most important to me is the opportunity to learn, contribute meaningfully, and grow with a great team. I'm also very interested in the role scope, mentorship opportunities, and growth potential - those factors are just as important as the base salary.

In terms of location, I'm based in Brisbane and would prefer to stay in Queensland - Brisbane, Gold Coast, or other Queensland locations work well for me. I'm also very open to remote or hybrid arrangements, and I have 20+ weeks of remote work experience from my internships with ausbiz Consulting, so I'm comfortable with remote collaboration.

I'm graduating in June 2026, so I'm looking for positions that could potentially start part-time during my final semester and transition to full-time after graduation. Is there flexibility in the role structure to accommodate that timeline?"""

    def _format_availability_response(self) -> str:
        return """I'm graduating in June 2026, so my availability has two phases:

**Current availability:** I'm authorized to work part-time during the semester - up to 20 hours per week - and full-time during university breaks. Right now I'm managing my AI Builder internship, mentoring responsibilities, and studies quite well, so I could potentially take on the right opportunity with proper scheduling.

**Post-graduation:** From July 2026 onwards, I'll be available for full-time work and eligible for a post-study work visa, which gives me full work authorization in Australia.

The ideal scenario would be a role that could start part-time - maybe 15-20 hours per week - during my final semester, then transition to full-time once I graduate. This would actually be perfect timing for a graduate program intake.

I have a good track record of balancing multiple commitments - I'm currently managing internship work, mentoring 100+ students, part-time hospitality work, and maintaining a 6.17 GPA. So I'm confident I can contribute meaningfully even on a part-time basis initially.

Is there flexibility in the role structure to accommodate this kind of timeline? I'd love to discuss how we could make it work."""

    def _format_company_interest_response(self) -> str:
        return """I'd need to research your specific company to give you a detailed answer, but I can share what generally excites me about potential opportunities.

I'm particularly drawn to companies that are doing innovative work with AI/ML technologies, especially those applying it to solve real business problems. Having built production AI systems like my Food RAG Explorer and digital twin implementations, I'm excited by organizations that are pushing the boundaries of what's possible with AI.

I also value companies with strong engineering cultures - places where I can learn from experienced developers, contribute ideas even as a junior team member, and grow technically. My mentoring experience has shown me how much I learn when I'm around people who challenge me to think differently.

From a practical standpoint, I'm looking for remote-friendly or Brisbane-based opportunities, and I'm particularly interested in companies that offer structured onboarding for new graduates - since I'm graduating in June 2026.

Could you tell me more about what makes your company special? What are the engineering team's biggest challenges right now? And what does the learning and development culture look like? I'd love to understand what makes this opportunity unique and how I could contribute to your team's success."""

    def _customize_for_company(self, response: str, company_context: str) -> str:
        """Customize response for specific company context"""
        # Add company-specific elements if provided
        if company_context:
            # This could be enhanced with company-specific research
            addition = f"\n\nBased on what I know about {company_context}, this experience seems particularly relevant because..."
            return response + addition
        return response

# Example usage and testing
if __name__ == "__main__":
    # Load knowledge base (would normally come from digitaltwin.json)
    sample_kb = {
        "content_chunks": [
            {
                "id": "exp-1",
                "title": "AI Builder Experience",
                "type": "experience",
                "content": "Currently working as AI Builder Intern developing digital twins and RAG systems..."
            }
        ]
    }
    
    # Initialize the system
    interview_system = InterviewOptimizedDigitalTwin(sample_kb)
    
    # Test with sample questions
    test_questions = [
        "Tell me about a challenging project you worked on",
        "Explain your experience with RAG systems", 
        "Why do you want to work at our company?",
        "What are your salary expectations?"
    ]
    
    for question in test_questions:
        result = interview_system.process_interview_question(question)
        print(f"\nQuestion: {question}")
        print(f"Type: {result['query_type']}")
        print(f"Response: {result['response'][:200]}...")
        print(f"Valid: {result['validation'].is_valid}")
        if result['validation'].issues:
            print(f"Issues: {result['validation'].issues}")