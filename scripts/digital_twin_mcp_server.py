#!/usr/bin/env python3
"""
Digital Twin MCP Server
Connects Claude Desktop to your digital twin via the Next.js API
"""

import asyncio
import json
import sys
from typing import Any, Dict, List
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

# Server configuration
API_BASE_URL = "http://localhost:3000/api/mcp"
TIMEOUT = 30.0

app = Server("digital-twin")

@app.list_tools()
async def list_tools() -> List[Tool]:
    """List available tools."""
    return [
        Tool(
            name="query_digital_twin",
            description="Query Jashandeep's digital twin using RAG",
            inputSchema={
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "Question to ask the digital twin"
                    }
                },
                "required": ["question"]
            }
        ),
        Tool(
            name="get_sample_questions",
            description="Get sample questions to ask the digital twin",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="test_connection",
            description="Test connection to the digital twin server",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            if name == "query_digital_twin":
                question = arguments.get("question", "")
                if not question:
                    return [TextContent(type="text", text="Error: Question is required")]
                
                # Make POST request to the digital twin API
                response = await client.post(
                    API_BASE_URL,
                    json={"question": question},
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return [TextContent(type="text", text=data.get("response", "No response received"))]
                else:
                    return [TextContent(type="text", text=f"Error: HTTP {response.status_code} - {response.text}")]
            
            elif name == "get_sample_questions":
                # Make GET request for sample questions
                response = await client.get(f"{API_BASE_URL}?action=sample_questions")
                
                if response.status_code == 200:
                    data = response.json()
                    questions = data.get("questions", [])
                    if questions:
                        formatted_questions = "\n".join([f"• {q}" for q in questions])
                        return [TextContent(type="text", text=f"Sample questions you can ask:\n\n{formatted_questions}")]
                    else:
                        return [TextContent(type="text", text="No sample questions available")]
                else:
                    return [TextContent(type="text", text=f"Error: HTTP {response.status_code} - {response.text}")]
            
            elif name == "test_connection":
                # Test connection to the API
                response = await client.get(f"{API_BASE_URL}?action=test")
                
                if response.status_code == 200:
                    return [TextContent(type="text", text="✅ Connection to digital twin server successful!")]
                else:
                    return [TextContent(type="text", text=f"❌ Connection failed: HTTP {response.status_code}")]
            
            else:
                return [TextContent(type="text", text=f"Unknown tool: {name}")]
                
    except httpx.TimeoutException:
        return [TextContent(type="text", text="Error: Request timed out. Make sure the Next.js server is running on http://localhost:3000")]
    except httpx.ConnectError:
        return [TextContent(type="text", text="Error: Cannot connect to the digital twin server. Make sure it's running on http://localhost:3000")]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]

async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())