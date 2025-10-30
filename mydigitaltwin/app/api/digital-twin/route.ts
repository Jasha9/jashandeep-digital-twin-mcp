import { NextRequest, NextResponse } from 'next/server'
import { queryDigitalTwin, testConnection, getSampleQuestions, compareRAGApproaches, getPerformanceStats } from '../../../lib/digital-twin-actions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'test':
        const connectionResult = await testConnection()
        return NextResponse.json(connectionResult)
      
      case 'samples':
        const questions = await getSampleQuestions()
        return NextResponse.json({ success: true, questions })
      
      case 'performance':
        const stats = await getPerformanceStats()
        return NextResponse.json({ success: true, stats })
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use ?action=test, ?action=samples, or ?action=performance' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, useEnhanced = true, compare = false } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Question is required and must be a string'
      }, { status: 400 })
    }

    // Handle comparison request
    if (compare) {
      const comparison = await compareRAGApproaches(question)
      return NextResponse.json(comparison)
    }

    // Handle regular query with enhanced/basic toggle
    const result = await queryDigitalTwin(question, useEnhanced)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}