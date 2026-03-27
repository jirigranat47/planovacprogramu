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
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
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
    console.log('Event Creation Payload:', body)
    const { name, startTime, endTime } = body

    if (!name || !startTime || !endTime) {
      console.warn('Missing required fields:', { name, startTime, endTime })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        name,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        tracks: {
          create: [
            { name: 'Hlavní program', color: '#3B82F6' }
          ]
        },
        users: {
          create: {
            userId: session.user.id,
            role: 'OWNER'
          }
        }
      }
    })

    console.log('Event created successfully:', event.id)
    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Detailed API Error during Event Creation:', error)
    // If it's a Prisma error, it might have a 'code' or 'meta' field
    const errorDetails = {
      message: error.message,
      code: error.code,
      meta: error.meta,
      clientVersion: error.clientVersion
    }
    return NextResponse.json({ 
      error: 'Failed to create event', 
      details: error.message,
      prismaError: errorDetails 
    }, { status: 500 })
  }
}
