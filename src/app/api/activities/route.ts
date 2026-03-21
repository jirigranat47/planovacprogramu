import { prisma } from '../../../lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, duration, description, eventId, category } = body

    if (!name || !eventId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const activity = await prisma.activity.create({
      data: {
        name,
        duration: parseInt(duration) || 30,
        description,
        eventId,
        category,
      }
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
