"use server"

import { Index } from "@upstash/vector"
import fs from 'fs'
import path from 'path'

// Initialize Upstash Vector client
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

interface DigitalTwinData {
  personal: {
    name: string
    location: string
    title: string
    summary: string
  }
  experience: Array<{
    title: string
    company: string
    duration: string
    description: string
  }>
  skills: {
    technical: string[]
    soft: string[]
    frameworks: string[]
  }
  projects: Array<{
    name: string
    description: string
    technologies: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    year: string
  }>
  content_chunks: Array<{
    id: string
    title: string
    content: string
    type: string
    category: string
    tags: string[]
  }>
}

export async function uploadDigitalTwinData(): Promise<{ success: boolean; message: string; uploaded?: number }> {
  try {
    // Read the digitaltwin.json file from the root of the workspace
    const filePath = path.join(process.cwd(), '..', 'digitaltwin.json')
    
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        message: `Digital twin data file not found at ${filePath}`
      }
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data: DigitalTwinData = JSON.parse(fileContent)

    if (!data.content_chunks || !Array.isArray(data.content_chunks)) {
      return {
        success: false,
        message: 'Invalid data format: content_chunks array not found'
      }
    }

    // Prepare vectors for upload (ensure they have dt- prefix for identification)
    const vectors = data.content_chunks.map(chunk => ({
      id: chunk.id.startsWith('dt-') ? chunk.id : `dt-${chunk.id}`,
      data: chunk.content, // Upstash will automatically embed this
      metadata: {
        title: chunk.title,
        content: chunk.content,
        type: chunk.type,
        category: chunk.category,
        tags: chunk.tags,
        source: 'digital_twin'
      }
    }))

    console.log(`📤 Uploading ${vectors.length} vectors to Upstash...`)

    // Upload vectors in batches to avoid rate limits
    const batchSize = 5
    let uploaded = 0

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize)
      await index.upsert(batch)
      uploaded += batch.length
      console.log(`✅ Uploaded batch ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(vectors.length / batchSize)}`)
      
      // Small delay between batches
      if (i + batchSize < vectors.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return {
      success: true,
      message: `Successfully uploaded ${uploaded} content chunks to vector database`,
      uploaded
    }

  } catch (error) {
    console.error('❌ Error uploading digital twin data:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function clearDigitalTwinData(): Promise<{ success: boolean; message: string }> {
  try {
    // Get all vectors with dt- prefix
    const results = await index.query({
      data: "sample query",
      topK: 100,
      includeMetadata: true
    })

    const digitalTwinIds = results
      .filter((result: any) => result.id && result.id.startsWith('dt-'))
      .map((result: any) => result.id)

    if (digitalTwinIds.length === 0) {
      return {
        success: true,
        message: 'No digital twin data found to clear'
      }
    }

    // Delete vectors by ID
    await index.delete(digitalTwinIds)

    return {
      success: true,
      message: `Successfully cleared ${digitalTwinIds.length} digital twin vectors`
    }

  } catch (error) {
    console.error('❌ Error clearing digital twin data:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}