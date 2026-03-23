import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Vrátíme pouze akce, kde je uživatel uveden jako spolupracovník/vlastník
    const events = await prisma.event.findMany({
      where: {
        users: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        users: true
      },
      orderBy: { startTime: 'desc' }
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
        },
        // Automaticky přidáme tvůrce jako OWNERa
        users: {
          create: {
            userId: session.user.id,
            role: 'OWNER'
          }
        }
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
