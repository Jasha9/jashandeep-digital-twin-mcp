# Claude Desktop MCP Server Configuration Guide

## 🚀 Production Deployment Configuration

Your Digital Twin MCP server is live at: **https://jashandeep-digital-twin-mcp.vercel.app**

### 📋 Claude Desktop Configuration

**Step 1:** Open Claude Desktop Settings
- Go to Settings → Developer → MCP Servers

**Step 2:** Add Production Server Configuration
```json
{
  "mcpServers": {
    "digital-twin-production": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://jashandeep-digital-twin-mcp.vercel.app/api/mcp"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Step 3:** Alternative Configuration (for local development)
```json
{
  "mcpServers": {
    "digital-twin-local": {
      "command": "node",
      "args": ["digital_twin_mcp_server.py"],
      "cwd": "C:\\Users\\jasha\\Downloads\\Desktop\\Digital Twin\\digital-twin-workshop",
      "env": {
        "UPSTASH_VECTOR_REST_URL": "your_url_here",
        "GROQ_API_KEY": "your_key_here"
      }
    }
  }
}
```

### 🔧 VS Code MCP Configuration

The project includes both production and local configurations in `.vscode/mcp.json`:

```json
{
  "servers": {
    "digital-twin-production": {
      "type": "http",
      "url": "https://jashandeep-digital-twin-mcp.vercel.app/api/mcp"
    },
    "digital-twin-local": {
      "type": "http", 
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

### 🧪 Testing Your Configuration

**1. Test MCP Connection:**
```powershell
# Test production endpoint
$headers = @{"Content-Type" = "application/json"}
$body = '{"jsonrpc":"2.0","method":"tools/list","id":1}'
Invoke-RestMethod -Uri "https://jashandeep-digital-twin-mcp.vercel.app/api/mcp" -Method POST -Headers $headers -Body $body
```

**2. Test Digital Twin Query:**
```powershell
# Test AI functionality
$headers = @{"Content-Type" = "application/json"}
$body = '{"question":"What are your key strengths?"}'
Invoke-RestMethod -Uri "https://jashandeep-digital-twin-mcp.vercel.app/api/digital-twin" -Method POST -Headers $headers -Body $body
```

**3. Available MCP Tools:**
- `query_digital_twin` - Ask questions about professional background
- `get_sample_questions` - Get interview preparation questions  
- `test_connection` - Verify system health

### 🎯 Usage Examples

Once configured in Claude Desktop, you can:

1. **Ask Professional Questions:**
   - "Tell me about your technical experience"
   - "What projects have you worked on?"
   - "Describe your key achievements"

2. **Interview Preparation:**
   - "Give me behavioral interview questions"
   - "Help me prepare for a software engineering interview"
   - "What are your career goals?"

3. **Technical Deep Dives:**
   - "Explain your experience with AI/ML"
   - "What's your full-stack development background?"
   - "Tell me about your cloud deployment experience"

### ✅ Verification Checklist

- [ ] MCP server responds to tools/list request
- [ ] Digital twin API returns valid responses  
- [ ] Vector database connection is working
- [ ] AI responses are contextual and professional
- [ ] All 3 MCP tools are available
- [ ] Claude Desktop can connect successfully

### 🔧 Troubleshooting

**Common Issues:**

1. **Connection Failed:** Verify URL is correct and deployment is active
2. **Invalid Response:** Check environment variables in Vercel dashboard
3. **Timeout Errors:** Use production endpoint instead of localhost
4. **Authentication:** Ensure API keys are properly configured in Vercel

**Support Resources:**
- GitHub Repository: https://github.com/Jasha9/jashandeep-digital-twin-mcp
- Live Demo: https://jashandeep-digital-twin-mcp.vercel.app
- MCP Documentation: https://modelcontextprotocol.io

### 🎉 Ready for Use!

Your Digital Twin MCP server is fully deployed and ready for:
- ✅ Professional interview preparation
- ✅ Career consulting and guidance  
- ✅ Technical skills demonstration
- ✅ Real-time AI-powered responses
- ✅ Multi-platform integration (Claude Desktop + VS Code)

---

**Last Updated:** October 29, 2025  
**Deployment Status:** ✅ Live and Operational  
**Performance:** Sub-second response times