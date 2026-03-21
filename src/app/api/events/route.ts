import { prisma } from '../../../lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        tracks: {
          include: {
            activities: {
              include: {
                subtasks: true
              }
            }
          }
        },
        activities: {
          where: {
            trackId: null
          },
          include: {
            subtasks: true
          }
        }
      }
    })
    
    return NextResponse.json(events)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
