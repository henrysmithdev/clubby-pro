// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
}

export const maxDuration = 60

const OPENAI_KEY = process.env.OPENAI_API_KEY

const SWING_PROMPT = `You are an expert PGA golf swing analyst. Analyze this golf swing image sequence and provide a detailed breakdown.

For each frame, identify:
1. Body position (spine angle, shoulder turn, hip rotation, knee flex, weight distribution)
2. Club position (shaft angle, face angle, plane)
3. Key checkpoints for that phase of the swing

Then provide an overall analysis with:

**phases** - Array of objects for each swing phase detected:
  - phase: "address" | "takeaway" | "backswing" | "top" | "downswing" | "impact" | "follow_through" | "finish"
  - score: 1-10 rating for this phase
  - notes: Brief analysis of what's good and what needs work
  - lines: Array of line annotations to draw. Each line has:
    - label: what the line represents (e.g. "Spine Angle", "Club Plane", "Hip Line")
    - color: hex color for the line
    - startX, startY, endX, endY: coordinates as percentages (0-100) of image width/height

**overallScore**: 1-100 composite score
**strengths**: Array of 2-3 key strengths
**improvements**: Array of 2-3 priority improvements with specific drills
**swingType**: "full" | "chip" | "pitch" | "putt" | "driver" | "iron"
**tempo**: "fast" | "moderate" | "slow" with notes
**handicapEstimate**: Estimated handicap range based on swing mechanics (e.g. "15-20")

Return ONLY valid JSON matching this schema. No markdown, no code blocks.`

export async function POST(req: NextRequest) {
  if (!OPENAI_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { frames } = body // Array of base64 image data URLs

    if (!frames || frames.length === 0) {
      return NextResponse.json({ error: 'No frames provided' }, { status: 400 })
    }

    // Build messages with frame images
    const content = [
      { type: 'text', text: SWING_PROMPT },
      ...frames.slice(0, 6).map((frame: string, i: number) => ({
        type: 'image_url',
        image_url: {
          url: frame.startsWith('data:') ? frame : `data:image/jpeg;base64,${frame}`,
          detail: 'high',
        },
      })),
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('OpenAI error:', JSON.stringify(data.error))
      return NextResponse.json({ error: data.error.message || 'AI analysis failed' }, { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content || ''
    
    // Parse JSON from response (strip any markdown wrapping)
    let analysis
    try {
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(jsonStr)
    } catch {
      analysis = { raw: text, overallScore: 0, error: 'Failed to parse analysis' }
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
