import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startTime: 'desc' }
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, startTime, endTime } = body

    const event = await prisma.event.create({
      data: {
        name,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        tracks: {
          create: [
            { name: 'Vlčata', color: '#3B82F6' },
            { name: 'Skauti', color: '#10B981' },
            { name: 'Roveři', color: '#8B5CF6' }
          ]
        }
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
