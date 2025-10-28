"""
Company-Specific Response Customization System
Tailors responses based on company research and industry context
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import re

@dataclass
class CompanyProfile:
    name: str
    industry: str
    tech_stack: List[str]
    values: List[str]
    size: str
    culture_keywords: List[str]
    recent_news: List[str]

class CompanyResponseCustomizer:
    """Customizes responses for specific companies and industries"""
    
    def __init__(self):
        self.brisbane_companies = {
            "suncorp": CompanyProfile(
                name="Suncorp Group",
                industry="Financial Services/Insurance",
                tech_stack=["Java", "Python", "AWS", "Microservices", "React", "API Gateway"],
                values=["Customer First", "Own It", "Be Bold", "Stay Curious"],
                size="Large Enterprise (14,000+ employees)",
                culture_keywords=["innovation", "digital transformation", "customer-centric", "agile"],
                recent_news=["Digital banking transformation", "Cloud-first strategy", "AI/ML initiatives"]
            ),
            "flight_centre": CompanyProfile(
                name="Flight Centre Travel Group",
                industry="Travel Technology",
                tech_stack=["Java", "JavaScript", "React", "Node.js", "AWS", "Microservices"],
                values=["People First", "Customer Focused", "Bright Future", "Ownership"],
                size="Large Enterprise (18,000+ employees)",
                culture_keywords=["innovation", "travel tech", "customer experience", "global"],
                recent_news=["Travel recovery technology", "Digital experience platforms", "Mobile innovation"]
            ),
            "xero": CompanyProfile(
                name="Xero",
                industry="FinTech/SaaS",
                tech_stack=["C#", "React", "AWS", "Microservices", "TypeScript", "GraphQL"],
                values=["Human", "Purposeful", "Adventurous"],
                size="Large (4,000+ employees)",
                culture_keywords=["small business", "beautiful software", "innovation", "human"],
                recent_news=["AI automation features", "Small business platform expansion", "Developer API growth"]
            ),
            "technologyone": CompanyProfile(
                name="TechnologyOne",
                industry="Enterprise Software/SaaS",
                tech_stack=["Java", "React", "Angular", "AWS", "Microservices", "REST APIs"],
                values=["Innovation", "Quality", "Service", "People"],
                size="Large (1,300+ employees)",
                culture_keywords=["enterprise software", "innovation", "continuous improvement", "customer success"],
                recent_news=["SaaS transformation", "AI-powered solutions", "Government sector growth"]
            )
        }
        
        self.industry_patterns = {
            "fintech": {
                "keywords": ["financial", "banking", "payments", "investment", "trading"],
                "tech_emphasis": ["security", "scalability", "compliance", "data analytics"],
                "value_props": ["quantitative thinking", "attention to detail", "regulatory understanding"]
            },
            "consulting": {
                "keywords": ["consulting", "advisory", "transformation", "strategy"],
                "tech_emphasis": ["client solutions", "adaptability", "communication"],
                "value_props": ["problem-solving", "client focus", "business impact"]
            },
            "startup": {
                "keywords": ["startup", "scale-up", "growth", "agile"],
                "tech_emphasis": ["rapid development", "MVP", "innovation", "flexibility"],
                "value_props": ["adaptability", "ownership", "growth mindset"]
            }
        }
    
    def customize_response(self, base_response: str, company_context: str, query_type: str) -> str:
        """Customize response for specific company context"""
        
        # Identify company if possible
        company_profile = self._identify_company(company_context)
        
        if company_profile:
            return self._customize_for_known_company(base_response, company_profile, query_type)
        else:
            return self._customize_for_industry(base_response, company_context, query_type)
    
    def _identify_company(self, company_context: str) -> Optional[CompanyProfile]:
        """Try to identify the company from context"""
        context_lower = company_context.lower()
        
        for key, profile in self.brisbane_companies.items():
            if key in context_lower or profile.name.lower() in context_lower:
                return profile
        
        return None
    
    def _customize_for_known_company(self, base_response: str, company: CompanyProfile, query_type: str) -> str:
        """Customize response for a known company"""
        
        customizations = []
        
        # Tech stack alignment
        my_tech = ["Python", "JavaScript", "TypeScript", "React", "Next.js", "AWS", "Node.js"]
        matching_tech = [tech for tech in company.tech_stack if tech in my_tech]
        
        if matching_tech and query_type == "technical":
            customizations.append(f"\nWhat's particularly exciting about {company.name} is your tech stack - I have hands-on experience with {', '.join(matching_tech[:3])}, which aligns well with your technology choices.")
        
        # Values alignment
        if query_type == "company_specific":
            if "Customer" in company.values or "customer" in [v.lower() for v in company.values]:
                customizations.append(f"\nYour focus on customer-centricity really resonates with me. Through my mentoring work supporting 100+ students and my hospitality experience, I've learned that understanding user needs is fundamental to building great solutions.")
            
            if "Innovation" in company.values or "innovation" in [v.lower() for v in company.values]:
                customizations.append(f"\nI'm particularly drawn to {company.name}'s emphasis on innovation. Building cutting-edge AI systems like my RAG implementation and digital twin projects has shown me how exciting it is to work with emerging technologies that solve real problems.")
        
        # Industry-specific points
        if company.industry == "Financial Services/Insurance" and query_type in ["behavioral", "company_specific"]:
            customizations.append(f"\nWhile I don't have direct financial services experience, I'm genuinely interested in how technology can improve financial accessibility and user experience. My systematic approach to learning - demonstrated through mastering AI/ML technologies - would help me quickly understand your domain and contribute meaningfully.")
        
        if company.industry == "Travel Technology":
            customizations.append(f"\nThe travel industry's focus on user experience and seamless digital interactions aligns perfectly with my full-stack development background and AI integration experience.")
        
        # Size-appropriate messaging
        if "Large Enterprise" in company.size:
            customizations.append(f"\nI'm excited about the opportunity to work at enterprise scale - my experience building production systems has shown me the importance of scalability, reliability, and collaboration in larger organizations.")
        
        # Add customizations to base response
        if customizations:
            return base_response + "".join(customizations)
        
        return base_response
    
    def _customize_for_industry(self, base_response: str, context: str, query_type: str) -> str:
        """Customize response based on industry patterns"""
        
        context_lower = context.lower()
        
        # Identify industry
        for industry, patterns in self.industry_patterns.items():
            if any(keyword in context_lower for keyword in patterns["keywords"]):
                return self._add_industry_customization(base_response, industry, patterns, query_type)
        
        # Generic company customization
        return self._add_generic_customization(base_response, context, query_type)
    
    def _add_industry_customization(self, base_response: str, industry: str, patterns: Dict, query_type: str) -> str:
        """Add industry-specific customization"""
        
        customizations = []
        
        if industry == "fintech" and query_type in ["behavioral", "company_specific"]:
            customizations.append(f"\nI'm particularly interested in fintech because of the intersection of technology and quantitative problem-solving. While I don't have direct finance experience, my systematic approach to learning complex technologies and my attention to detail in AI system development demonstrate the analytical thinking that's valuable in financial technology.")
        
        elif industry == "consulting" and query_type == "behavioral":
            customizations.append(f"\nMy mentoring experience has taught me how to understand different client needs and adapt my communication style accordingly - skills that translate well to consulting environments where you need to quickly understand client contexts and deliver tailored solutions.")
        
        elif industry == "startup" and query_type in ["behavioral", "company_specific"]:
            customizations.append(f"\nI'm excited about startup environments because of the opportunity to wear multiple hats and have direct impact. My experience managing multiple responsibilities - internship, mentoring, studies, and part-time work - has taught me how to be adaptable and take ownership.")
        
        if customizations:
            return base_response + "".join(customizations)
        
        return base_response
    
    def _add_generic_customization(self, base_response: str, context: str, query_type: str) -> str:
        """Add generic company-focused customization"""
        
        if query_type == "company_specific":
            addition = f"\n\nI'd love to learn more about your specific challenges and how I could contribute to your team's success. Based on my research and what we've discussed, it sounds like there's a great alignment between my technical skills and growth mindset and what you're looking for."
            return base_response + addition
        
        return base_response
    
    def get_company_research_template(self, company_name: str) -> Dict[str, List[str]]:
        """Get research template for preparing company-specific responses"""
        
        return {
            "company_basics": [
                f"What does {company_name} do? (products/services)",
                f"What's {company_name}'s mission and values?",
                f"Recent news or developments about {company_name}",
                f"Company size and structure"
            ],
            "technical_research": [
                f"What technologies does {company_name} use?",
                f"Engineering blog posts or tech talks from {company_name}",
                f"Open source projects by {company_name}",
                f"Technical challenges mentioned in job descriptions"
            ],
            "culture_research": [
                f"Employee reviews on Glassdoor about {company_name}",
                f"LinkedIn posts from {company_name} employees",
                f"Company culture videos or content",
                f"Diversity and inclusion initiatives"
            ],
            "preparation_questions": [
                f"Why specifically do you want to work at {company_name}?",
                f"How do your skills align with {company_name}'s needs?",
                f"What unique value could you bring to {company_name}?",
                f"What questions would you ask about {company_name}'s challenges?"
            ]
        }
    
    def generate_why_company_response(self, company_context: str, personal_strengths: List[str]) -> str:
        """Generate tailored 'Why do you want to work here?' response"""
        
        company_profile = self._identify_company(company_context)
        
        if company_profile:
            response = f"I'm excited about the opportunity at {company_profile.name} for several specific reasons:\n\n"
            
            # Technical alignment
            my_tech = ["Python", "JavaScript", "React", "Next.js", "AWS", "AI/ML"]
            matching_tech = [tech for tech in company_profile.tech_stack if any(my_tech_item in tech for my_tech_item in my_tech)]
            
            if matching_tech:
                response += f"**Technical Fit:** Your use of {', '.join(matching_tech[:2])} aligns perfectly with my hands-on experience. I've built production applications with these technologies during my internships and personal projects.\n\n"
            
            # Industry excitement
            if "Financial" in company_profile.industry:
                response += f"**Industry Impact:** I'm drawn to {company_profile.industry.lower()} because of the intersection of technology and quantitative problem-solving. While I'm new to finance, my systematic approach to mastering AI/ML technologies shows I can quickly learn domain-specific knowledge.\n\n"
            
            # Values alignment
            if company_profile.values:
                response += f"**Values Alignment:** Your emphasis on {company_profile.values[0]} resonates with my experience - whether it's putting students first in my mentoring role or focusing on user experience in my applications.\n\n"
            
            # Growth opportunity
            response += f"**Growth Opportunity:** As someone graduating in June 2026, I'm looking for a place where I can contribute immediately while growing into more complex challenges. {company_profile.name}'s reputation for {company_profile.culture_keywords[0]} suggests this would be the right environment for that journey."
            
        else:
            # Generic but thoughtful response
            response = f"Based on my research about your company, I'm excited by several factors:\n\n"
            response += f"**Technical Opportunity:** The chance to work with modern technologies and solve complex problems aligns with my experience building AI systems and full-stack applications.\n\n"
            response += f"**Learning Environment:** I'm looking for a role where I can contribute my existing skills while learning from experienced team members and taking on new challenges.\n\n"
            response += f"**Mission Alignment:** Your focus on [specific company mission/value from research] resonates with my experience building solutions that help people, whether through my mentoring work or my technical projects."
        
        return response

# Example usage
if __name__ == "__main__":
    customizer = CompanyResponseCustomizer()
    
    # Test company identification
    base_response = "I have experience with React, Next.js, and AWS cloud deployment."
    
    suncorp_context = "Suncorp Group is looking for developers to join their digital transformation team"
    customized = customizer.customize_response(base_response, suncorp_context, "technical")
    
    print("Base Response:", base_response)
    print("\nCustomized for Suncorp:", customized)
    
    # Test research template
    research = customizer.get_company_research_template("Atlassian")
    print("\nResearch Template:", research)