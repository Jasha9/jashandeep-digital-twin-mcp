"""
Recruiter Satisfaction Practice Framework
Target: 85%+ satisfaction rate with systematic improvement
"""

from typing import Dict, List, Optional
import json
from datetime import datetime

class RecruiterSatisfactionTrainer:
    def __init__(self):
        self.target_satisfaction = 85
        self.current_score = 0
        self.practice_sessions = []
        
    def practice_response(self, question: str, response: str, context: Dict) -> Dict:
        """
        Practice and score a response for recruiter satisfaction
        """
        session_data = {
            "timestamp": datetime.now().isoformat(),
            "question": question,
            "response": response,
            "context": context,
            "analysis": self.analyze_response_quality(response, question, context)
        }
        
        self.practice_sessions.append(session_data)
        return session_data["analysis"]
    
    def analyze_response_quality(self, response: str, question: str, context: Dict) -> Dict:
        """
        Comprehensive response analysis for recruiter satisfaction
        """
        analysis = {
            "overall_score": 0,
            "component_scores": {},
            "satisfaction_prediction": 0,
            "recommendations": [],
            "strengths": [],
            "improvement_areas": []
        }
        
        # 1. Content Quality Analysis (35% of score)
        content_score = self._analyze_content_quality(response, context)
        analysis["component_scores"]["content"] = content_score
        
        # 2. Structure & Clarity (25% of score)  
        structure_score = self._analyze_structure(response, question)
        analysis["component_scores"]["structure"] = structure_score
        
        # 3. Professional Impact (25% of score)
        impact_score = self._analyze_professional_impact(response)
        analysis["component_scores"]["impact"] = impact_score
        
        # 4. Authenticity & Engagement (15% of score)
        engagement_score = self._analyze_engagement(response)
        analysis["component_scores"]["engagement"] = engagement_score
        
        # Calculate overall scores
        analysis["overall_score"] = (
            content_score * 0.35 + 
            structure_score * 0.25 + 
            impact_score * 0.25 + 
            engagement_score * 0.15
        )
        
        # Predict recruiter satisfaction (correlation factor: 0.92)
        analysis["satisfaction_prediction"] = min(analysis["overall_score"] * 0.92 + 8, 100)
        
        # Generate recommendations
        analysis["recommendations"] = self._generate_recommendations(analysis)
        
        return analysis
    
    def _analyze_content_quality(self, response: str, context: Dict) -> int:
        """Analyze content quality and relevance"""
        score = 0
        
        # Specificity check (quantifiable details)
        metrics_keywords = ['%', 'increased', 'decreased', 'improved', 'reduced', 'grew', 'achieved']
        if any(keyword in response.lower() for keyword in metrics_keywords):
            score += 25
        
        # Technical depth appropriateness
        if context.get('role_type') == 'technical':
            tech_keywords = ['architecture', 'implementation', 'optimization', 'scalability', 'performance']
            if any(keyword in response.lower() for keyword in tech_keywords):
                score += 20
        
        # Company research integration
        company_name = context.get('company', '').lower()
        if company_name and company_name in response.lower():
            score += 15
        
        # Role relevance
        role_keywords = context.get('key_skills', [])
        relevance_count = sum(1 for skill in role_keywords if skill.lower() in response.lower())
        score += min(relevance_count * 5, 20)
        
        # Example specificity
        example_indicators = ['when', 'where', 'how', 'specifically', 'for example', 'instance']
        if any(indicator in response.lower() for indicator in example_indicators):
            score += 20
        
        return min(score, 100)
    
    def _analyze_structure(self, response: str, question: str) -> int:
        """Analyze response structure and clarity"""
        score = 0
        
        # STAR method usage for behavioral questions
        behavioral_questions = ['tell me about', 'describe a time', 'give me an example']
        if any(phrase in question.lower() for phrase in behavioral_questions):
            star_elements = ['situation', 'task', 'action', 'result']
            star_count = sum(1 for element in star_elements if element in response.lower())
            score += star_count * 15
        
        # Logical flow markers
        flow_markers = ['first', 'then', 'next', 'finally', 'as a result', 'this led to']
        if any(marker in response.lower() for marker in flow_markers):
            score += 20
        
        # Length optimization (225-450 words = 90-180 seconds)
        word_count = len(response.split())
        if 225 <= word_count <= 450:
            score += 30
        elif 180 <= word_count < 225 or 450 < word_count <= 500:
            score += 20
        elif word_count < 180 or word_count > 500:
            score += 10
        
        # Clear conclusion
        conclusion_markers = ['in summary', 'overall', 'this experience', 'as a result', 'ultimately']
        if any(marker in response.lower() for marker in conclusion_markers):
            score += 20
        
        return min(score, 100)
    
    def _analyze_professional_impact(self, response: str) -> int:
        """Analyze demonstration of professional impact"""
        score = 0
        
        # Leadership indicators
        leadership_keywords = ['led', 'managed', 'coordinated', 'initiated', 'drove', 'spearheaded']
        leadership_count = sum(1 for keyword in leadership_keywords if keyword in response.lower())
        score += min(leadership_count * 15, 30)
        
        # Collaboration signals
        collaboration_keywords = ['team', 'collaborated', 'worked with', 'cross-functional', 'stakeholders']
        if any(keyword in response.lower() for keyword in collaboration_keywords):
            score += 20
        
        # Problem-solving demonstration
        problem_keywords = ['challenge', 'problem', 'obstacle', 'difficulty', 'issue', 'solved']
        solution_keywords = ['solution', 'approach', 'strategy', 'method', 'resolved']
        has_problem = any(keyword in response.lower() for keyword in problem_keywords)
        has_solution = any(keyword in response.lower() for keyword in solution_keywords)
        if has_problem and has_solution:
            score += 25
        
        # Innovation/improvement
        innovation_keywords = ['improved', 'optimized', 'enhanced', 'streamlined', 'automated', 'innovated']
        if any(keyword in response.lower() for keyword in innovation_keywords):
            score += 25
        
        return min(score, 100)
    
    def _analyze_engagement(self, response: str) -> int:
        """Analyze authenticity and engagement factors"""
        score = 0
        
        # Personal learning/growth
        learning_keywords = ['learned', 'grew', 'developed', 'gained', 'discovered', 'realized']
        if any(keyword in response.lower() for keyword in learning_keywords):
            score += 30
        
        # Passion/enthusiasm indicators  
        enthusiasm_keywords = ['excited', 'passionate', 'love', 'enjoy', 'thrive', 'motivated']
        if any(keyword in response.lower() for keyword in enthusiasm_keywords):
            score += 25
        
        # Authenticity markers (challenges, feedback, adaptation)
        authenticity_keywords = ['feedback', 'mistake', 'challenge', 'difficult', 'adapted', 'adjusted']
        if any(keyword in response.lower() for keyword in authenticity_keywords):
            score += 25
        
        # Future orientation
        future_keywords = ['continue', 'next', 'future', 'going forward', 'plan to', 'will']
        if any(keyword in response.lower() for keyword in future_keywords):
            score += 20
        
        return min(score, 100)
    
    def _generate_recommendations(self, analysis: Dict) -> List[str]:
        """Generate specific improvement recommendations"""
        recommendations = []
        scores = analysis["component_scores"]
        
        if scores["content"] < 70:
            recommendations.extend([
                "Add specific, quantifiable examples with metrics",
                "Include more technical details relevant to the role",
                "Research and reference the company's specific challenges/goals"
            ])
        
        if scores["structure"] < 70:
            recommendations.extend([
                "Use STAR method for behavioral questions", 
                "Add clear transitions between points",
                "Aim for 90-180 seconds (225-450 words)"
            ])
        
        if scores["impact"] < 70:
            recommendations.extend([
                "Emphasize leadership and initiative-taking",
                "Describe collaboration with teams/stakeholders",
                "Highlight problem-solving and innovation"
            ])
        
        if scores["engagement"] < 70:
            recommendations.extend([
                "Share authentic challenges and learning moments",
                "Express genuine enthusiasm for the opportunity", 
                "Connect experiences to future goals"
            ])
        
        return recommendations
    
    def get_progress_report(self) -> Dict:
        """Generate progress report towards 85% target"""
        if not self.practice_sessions:
            return {"message": "No practice sessions recorded yet"}
        
        recent_sessions = self.practice_sessions[-10:]  # Last 10 sessions
        avg_satisfaction = sum(s["analysis"]["satisfaction_prediction"] for s in recent_sessions) / len(recent_sessions)
        
        progress = {
            "current_average": round(avg_satisfaction, 1),
            "target": self.target_satisfaction,
            "gap": round(self.target_satisfaction - avg_satisfaction, 1),
            "sessions_completed": len(self.practice_sessions),
            "trend": self._calculate_trend(),
            "next_milestones": self._get_next_milestones(avg_satisfaction)
        }
        
        return progress
    
    def _calculate_trend(self) -> str:
        """Calculate improvement trend"""
        if len(self.practice_sessions) < 5:
            return "Insufficient data"
        
        recent_5 = [s["analysis"]["satisfaction_prediction"] for s in self.practice_sessions[-5:]]
        earlier_5 = [s["analysis"]["satisfaction_prediction"] for s in self.practice_sessions[-10:-5]]
        
        if not earlier_5:
            return "Building baseline"
        
        recent_avg = sum(recent_5) / len(recent_5) 
        earlier_avg = sum(earlier_5) / len(earlier_5)
        
        if recent_avg > earlier_avg + 2:
            return "Improving"
        elif recent_avg < earlier_avg - 2:
            return "Declining" 
        else:
            return "Stable"
    
    def _get_next_milestones(self, current_avg: float) -> List[str]:
        """Get next achievement milestones"""
        milestones = []
        
        if current_avg < 70:
            milestones.append("Reach 70% satisfaction (Foundation)")
        elif current_avg < 80:
            milestones.append("Reach 80% satisfaction (Competitive)")
        elif current_avg < 85:
            milestones.append("Reach 85% satisfaction (TARGET)")
        elif current_avg < 90:
            milestones.append("Reach 90% satisfaction (Excellence)")
        else:
            milestones.append("Maintain 90%+ satisfaction (Mastery)")
        
        return milestones

# Example usage and practice questions
RECRUITER_PRACTICE_QUESTIONS = {
    "behavioral": [
        "Tell me about yourself and why you're interested in this role.",
        "Describe a challenging project you worked on recently.",
        "Tell me about a time when you had to learn something quickly.",
        "Give me an example of how you handle conflicting priorities.",
        "Describe a situation where you had to work with a difficult team member."
    ],
    
    "technical": [
        "Walk me through your experience with RAG systems and AI implementation.",
        "How do you approach full-stack development projects?",
        "Describe your experience with cloud deployment and DevOps.",
        "Tell me about a time you optimized system performance.",
        "How do you ensure code quality and maintainability?"
    ],
    
    "company_specific": [
        "Why do you want to work at [Company Name]?",
        "How would you contribute to our [specific team/project]?", 
        "What interests you about our [industry/mission]?",
        "How do your values align with our company culture?",
        "What questions do you have about our [technology/process]?"
    ]
}

def start_practice_session():
    """Initialize a practice session for recruiter satisfaction improvement"""
    trainer = RecruiterSatisfactionTrainer()
    
    print("🎯 Recruiter Satisfaction Training - Target: 85%+")
    print("\nPractice with these high-impact questions:")
    
    for category, questions in RECRUITER_PRACTICE_QUESTIONS.items():
        print(f"\n{category.title()} Questions:")
        for i, question in enumerate(questions, 1):
            print(f"  {i}. {question}")
    
    return trainer

if __name__ == "__main__":
    trainer = start_practice_session()