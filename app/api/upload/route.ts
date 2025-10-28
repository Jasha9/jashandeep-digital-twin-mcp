import { NextRequest, NextResponse } from 'next/server'
import { uploadDigitalTwinData, clearDigitalTwinData } from '../../../lib/upload-actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'upload':
        const uploadResult = await uploadDigitalTwinData()
        return NextResponse.json(uploadResult)
      
      case 'clear':
        const clearResult = await clearDigitalTwinData()
        return NextResponse.json(clearResult)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "upload" or "clear"'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Upload API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}