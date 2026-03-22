import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params;
    
    // Ověříme, zda má uživatel k akci přístup
    const userAccess = await prisma.eventUser.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.user.id
        }
      }
    })

    if (!userAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        tracks: {
          include: {
            activities: {
              include: {
                subtasks: true,
                responsibleUsers: true
              }
            }
          }
        },
        activities: {
          where: {
            trackId: null
          },
          include: {
            subtasks: true,
            responsibleUsers: true
          }
        }
      }
    })
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json(event)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params;

    // Smazat může jen OWNER
    const userAccess = await prisma.eventUser.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.user.id
        }
      }
    })

    if (!userAccess || userAccess.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete events' }, { status: 403 })
    }
    
    // Nejprve smažeme všechna související data
    await prisma.subtask.deleteMany({ where: { activity: { eventId: id } } });
    await prisma.activity.deleteMany({ where: { eventId: id } });
    await prisma.track.deleteMany({ where: { eventId: id } });
    await prisma.anchorPoint.deleteMany({ where: { eventId: id } });
    await prisma.eventUser.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
