# Jashandeep Kaur - Digital Twin MCP Server Project

## Project Overview
Build a personalized Digital Twin MCP Server for Jashandeep Kaur that provides intelligent responses about her professional background, experience, and goals using RAG (Retrieval-Augmented Generation) technology.

## Personal Context
- **Name**: Jashandeep Kaur
- **Role**: Aspiring Front-End Developer | IT Student at Victoria University
- **GitHub**: https://github.com/Jasha9
- **LinkedIn**: https://www.linkedin.com/in/jashandeep-kaur-06a28b287
- **Email**: jashandeepkaur459@gmail.com

## Reference Repositories
- **Pattern Reference**: https://github.com/gocallum/rolldice-mcpserver.git
  - Roll dice MCP server - use same technology and pattern for our MCP server
- **Logic Reference**: https://github.com/gocallum/binal_digital-twin_py.git
  - Python code using Upstash Vector for Retrieval-Augmented Generation with Groq and LLaMA for AI responses

## Core Functionality
- **Digital Twin Focus**: Answer questions about Jashandeep Kaur's professional background, experience, and career goals
- **Retrieval-Augmented Generation**: Search Upstash Vector database for relevant content chunks from `digitaltwin.json`
- **AI Response Generation**: Use Groq API with LLaMA models for personalized, context-aware responses
- **Data Structure**: 12 content chunks covering experience, education, skills, and personal information
- **Sample Queries**: Support questions about Victoria University, ausbiz Consulting internship, technical skills, and career objectives

## Current Data Schema
**Source File**: `digitaltwin.json` contains:
- Personal Information & Contact Details
- Education: Victoria University IT studies
- Work Experience: ausbiz Consulting Full Stack Developer Intern
- Technical Skills: HTML, CSS, JavaScript, React, Node.js, Python
- Projects: Portfolio website, web applications
- Career Goals: Front-end development focus
- Work Availability: Part-time/casual positions

## Environment Variables (.env.local)
**Required Environment Setup:**
```
# Upstash Vector Database for Retrieval-Augmented Generation
UPSTASH_VECTOR_REST_URL=your-upstash-vector-url
UPSTASH_VECTOR_REST_TOKEN=your-upstash-vector-token

# Groq AI for LLaMA model responses  
GROQ_API_KEY=your-groq-api-key

# Optional: Development settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Current API Endpoints:**
- `/api/digital-twin` - Main Retrieval-Augmented Generation endpoint for Jashandeep's profile
- `/api/upload` - Data upload to Upstash Vector database
- Admin Panel: `http://localhost:3000/admin` - Upload and manage digital twin data

## Technical Requirements
- **Framework**: Next.js 16.0.0 with React 19.2.0, TypeScript, Turbopack enabled
- **Package Manager**: Always use pnpm (never npm or yarn)
- **Commands**: Always use Windows PowerShell commands
- **Type Safety**: Enforce strong TypeScript type safety throughout
- **Architecture**: Server actions in `lib/digital-twin-actions.ts`
- **Styling**: Tailwind CSS 4.0 with responsive design
- **AI Integration**: groq-sdk 0.34.0 for LLaMA model responses
- **Database**: Upstash Vector with REST API integration
- **Focus**: Functional digital twin with clean, modern UI

## Current Implementation Files
- `lib/digital-twin-actions.ts` - Core Retrieval-Augmented Generation functionality
- `app/components/DigitalTwinChat.tsx` - Interactive chat interface
- `app/components/AdminUpload.tsx` - Data management panel
- `digitaltwin.json` - Jashandeep's resume data source
- `app/api/digital-twin/route.ts` - API endpoint
- `app/api/upload/route.ts` - Data upload endpoint

## Setup Commands
```bash
pnpm dlx shadcn@latest init
```
Reference: https://ui.shadcn.com/docs/installation/next

## Upstash Vector Integration

### Key Documentation
- Getting Started: https://upstash.com/docs/vector/overall/getstarted
- Embedding Models: https://upstash.com/docs/vector/features/embeddingmodels
- TypeScript SDK: https://upstash.com/docs/vector/sdks/ts/getting-started

### Example Implementation
```typescript
import { Index } from "@upstash/vector"

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

// Retrieval-Augmented Generation search example
await index.query({
  data: "What is Upstash?",
  topK: 3,
  includeMetadata: true,
})
```

## Testing & Deployment Guidelines

### Local Development
```powershell
# Start development server
pnpm run dev

# Access application
# Main app: http://localhost:3000
# Admin panel: http://localhost:3000/admin
```

### Testing Sample Queries
- "Tell me about your experience at Victoria University"
- "What technical skills do you have?"
- "Describe your internship at ausbiz Consulting"
- "What are your career goals?"
- "Are you available for work?"

### Data Management
- Use admin panel to upload/re-upload `digitaltwin.json`
- Verify data upload through test queries
- Check relevance scores (should be 0.7+ for good matches)

## Additional Resources
- **Upstash Vector Docs**: https://upstash.com/docs/vector/overall/getstarted
- **Groq API Docs**: https://console.groq.com/docs/quickstart
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Next.js 16 Docs**: https://nextjs.org/docs

---

**Note**: This file provides context for GitHub Copilot to generate accurate, project-specific code suggestions. Keep it updated as requirements evolve.
