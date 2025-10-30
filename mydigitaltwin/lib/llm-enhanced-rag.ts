// lib/llm-enhanced-rag.ts
// Advanced RAG optimization with LLM-powered query improvement and response refinement

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export interface RAGMetrics {
  queryEnhancementTime: number;
  vectorSearchTime: number;
  responseFormattingTime: number;
  totalTime: number;
  tokensUsed: number;
  originalQuery: string;
  enhancedQuery: string;
}

// RAG Configuration for different interview scenarios
export const RAG_CONFIGS = {
  technical_interview: {
    queryModel: 'llama-3.1-8b-instant',
    responseModel: 'llama-3.1-8b-instant',
    temperature: 0.3,
    focusAreas: ['technical skills', 'problem solving', 'architecture', 'code quality'],
    responseStyle: 'detailed technical examples with metrics'
  },
  
  behavioral_interview: {
    queryModel: 'llama-3.1-8b-instant', 
    responseModel: 'llama-3.1-8b-instant',
    temperature: 0.7,
    focusAreas: ['leadership', 'teamwork', 'communication', 'conflict resolution'],
    responseStyle: 'STAR format stories with emotional intelligence'
  },
  
  executive_interview: {
    queryModel: 'llama-3.1-8b-instant',
    responseModel: 'llama-3.1-8b-instant', 
    temperature: 0.5,
    focusAreas: ['strategic thinking', 'business impact', 'vision', 'leadership'],
    responseStyle: 'high-level strategic responses with business metrics'
  },

  general_interview: {
    queryModel: 'llama-3.1-8b-instant',
    responseModel: 'llama-3.1-8b-instant',
    temperature: 0.5,
    focusAreas: ['achievements', 'skills', 'experience', 'growth'],
    responseStyle: 'balanced professional responses with concrete examples'
  }
};

export async function enhanceQuery(
  originalQuery: string,
  interviewType: keyof typeof RAG_CONFIGS = 'general_interview'
): Promise<string> {
  const config = RAG_CONFIGS[interviewType];
  
  const enhancementPrompt = `
You are an interview preparation assistant that improves search queries for professional profile data.

Original question: "${originalQuery}"

Interview context: ${interviewType.replace('_', ' ')}
Focus areas: ${config.focusAreas.join(', ')}

Enhance this query to better search professional profile data by:
- Adding relevant synonyms and related terms for ${config.focusAreas.join(', ')}
- Expanding context for interview scenarios
- Including technical and soft skill variations
- Focusing on achievements and quantifiable results
- Considering ${config.responseStyle}

Return only the enhanced search query (no explanation):
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: enhancementPrompt }],
      model: config.queryModel,
      temperature: config.temperature,
      max_tokens: 150,
    });

    const enhanced = completion.choices[0]?.message?.content?.trim() || originalQuery;
    console.log(`Query enhanced: "${originalQuery}" → "${enhanced}"`);
    return enhanced;
  } catch (error) {
    console.error('Query enhancement failed:', error);
    return originalQuery; // Fallback to original query
  }
}

export async function formatForInterview(
  ragResults: any[],
  originalQuestion: string,
  interviewType: keyof typeof RAG_CONFIGS = 'general_interview'
): Promise<string> {
  const config = RAG_CONFIGS[interviewType];
  
  const context = ragResults
    .map(result => result.data || result.text || result.content)
    .filter(Boolean)
    .join('\n\n');

  if (!context.trim()) {
    return "I don't have enough information in my profile to answer that specific question. Could you ask about my technical skills, work experience, or projects?";
  }

  const formattingPrompt = `
You are an expert interview coach. Create a compelling interview response using this professional data.

Interview Type: ${interviewType.replace('_', ' ')}
Question: "${originalQuestion}"
Focus Areas: ${config.focusAreas.join(', ')}
Response Style: ${config.responseStyle}

Professional Background Data:
${context}

Create a response that:
- Directly addresses the interview question
- Uses specific examples and quantifiable achievements from the data
- Applies STAR format (Situation-Task-Action-Result) when telling stories
- Sounds confident and natural for an interview setting
- Highlights unique value and differentiators
- Includes relevant technical details without being overwhelming
- Matches the ${config.responseStyle} approach
- Stays focused on ${config.focusAreas.join(', ')}

Interview Response:
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: formattingPrompt }],
      model: config.responseModel,
      temperature: config.temperature,
      max_tokens: 600,
    });

    return completion.choices[0]?.message?.content?.trim() || 'Unable to generate enhanced response';
  } catch (error) {
    console.error('Response formatting failed:', error);
    return context; // Fallback to raw RAG results
  }
}

export async function detectInterviewType(question: string): Promise<keyof typeof RAG_CONFIGS> {
  const detectionPrompt = `
Analyze this interview question and classify it into one of these categories:

Question: "${question}"

Categories:
- technical_interview: Questions about coding, architecture, technical skills, system design
- behavioral_interview: Questions about teamwork, leadership, conflict resolution, past experiences
- executive_interview: Questions about strategy, business impact, vision, high-level thinking
- general_interview: Questions about background, motivation, general skills, career goals

Return only the category name:
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: detectionPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 50,
    });

    const detected = completion.choices[0]?.message?.content?.trim() as keyof typeof RAG_CONFIGS;
    
    if (detected && RAG_CONFIGS[detected]) {
      console.log(`Interview type detected: ${detected}`);
      return detected;
    }
  } catch (error) {
    console.error('Interview type detection failed:', error);
  }
  
  return 'general_interview'; // Default fallback
}

export async function monitoredRAGQuery(
  question: string,
  vectorSearchFn: (query: string) => Promise<any[]>
): Promise<{ response: string; metrics: RAGMetrics }> {
  const metrics: Partial<RAGMetrics> = {
    originalQuery: question
  };
  const startTime = Date.now();
  
  // Detect interview type
  const interviewType = await detectInterviewType(question);
  
  // Monitor query enhancement
  const enhanceStart = Date.now();
  const enhancedQuery = await enhanceQuery(question, interviewType);
  metrics.queryEnhancementTime = Date.now() - enhanceStart;
  metrics.enhancedQuery = enhancedQuery;
  
  // Monitor vector search
  const searchStart = Date.now();
  const vectorResults = await vectorSearchFn(enhancedQuery);
  metrics.vectorSearchTime = Date.now() - searchStart;
  
  // Monitor response formatting
  const formatStart = Date.now();
  const formattedResponse = await formatForInterview(vectorResults, question, interviewType);
  metrics.responseFormattingTime = Date.now() - formatStart;
  
  metrics.totalTime = Date.now() - startTime;
  metrics.tokensUsed = 0; // TODO: Track actual token usage
  
  // Log performance metrics
  console.log('Enhanced RAG Performance Metrics:', {
    totalTime: metrics.totalTime,
    queryEnhancementTime: metrics.queryEnhancementTime,
    vectorSearchTime: metrics.vectorSearchTime,
    responseFormattingTime: metrics.responseFormattingTime,
    interviewType
  });
  
  return {
    response: formattedResponse,
    metrics: metrics as RAGMetrics
  };
}