import { NextRequest, NextResponse } from 'next/server'
import { queryDigitalTwin, testConnection, getSampleQuestions } from '../../../lib/digital-twin-actions'

// MCP HTTP Server Implementation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle MCP protocol requests
    if (body.method === 'initialize') {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "digital-twin-mcp",
            version: "1.0.0"
          }
        }
      })
    }
    
    if (body.method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          tools: [
            {
              name: "query_digital_twin",
              description: "Query Jashandeep's digital twin using RAG",
              inputSchema: {
                type: "object",
                properties: {
                  question: {
                    type: "string",
                    description: "Question to ask the digital twin"
                  }
                },
                required: ["question"]
              }
            },
            {
              name: "get_sample_questions", 
              description: "Get sample questions to ask the digital twin",
              inputSchema: {
                type: "object",
                properties: {}
              }
            },
            {
              name: "test_connection",
              description: "Test connection to the vector database",
              inputSchema: {
                type: "object", 
                properties: {}
              }
            }
          ]
        }
      })
    }
    
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params
      
      let result: any
      
      switch (name) {
        case 'query_digital_twin':
          const question = args?.question
          if (!question) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id: body.id,
              error: {
                code: -32602,
                message: "Question parameter is required"
              }
            })
          }
          
          const queryResult = await queryDigitalTwin(question)
          
          if (queryResult.success) {
            let responseText = queryResult.answer || ''
            if (queryResult.sources) {
              responseText += "\n\nSources:\n"
              for (const source of queryResult.sources) {
                responseText += `• ${source.title} (Relevance: ${source.relevance.toFixed(3)})\n`
              }
            }
            result = {
              content: [
                {
                  type: "text",
                  text: responseText
                }
              ]
            }
          } else {
            result = {
              content: [
                {
                  type: "text", 
                  text: `Error: ${queryResult.error}`
                }
              ]
            }
          }
          break
          
        case 'get_sample_questions':
          const questions = await getSampleQuestions()
          let questionsText = "Sample questions you can ask:\n\n"
          questions.forEach((question, i) => {
            questionsText += `${i + 1}. ${question}\n`
          })
          
          result = {
            content: [
              {
                type: "text",
                text: questionsText
              }
            ]
          }
          break
          
        case 'test_connection':
          const connectionResult = await testConnection()
          const message = connectionResult.success 
            ? `${connectionResult.message} (Vectors: ${connectionResult.vectorCount || 0})`
            : connectionResult.message
            
          result = {
            content: [
              {
                type: "text",
                text: message
              }
            ]
          }
          break
          
        default:
          return NextResponse.json({
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`
            }
          })
      }
      
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result
      })
    }
    
    // Default response for unsupported methods
    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.id,
      error: {
        code: -32601,
        message: "Method not found"
      }
    })
    
  } catch (error) {
    console.error('MCP API Error:', error)
    return NextResponse.json({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    }, { status: 500 })
  }
}

// Handle GET requests for basic connectivity test
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "MCP Server Running",
    timestamp: new Date().toISOString(),
    endpoint: "/api/mcp",
    protocol: "JSON-RPC 2.0"
  })
}