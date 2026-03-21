import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
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
  try {
    const { id } = await params;
    
    // Nejprve smažeme všechna související data (pokud nemáme kaskádové mazání v DB)
    // V našem případě to Prisma vyřeší migrací nebo musíme ručně
    await prisma.subtask.deleteMany({ where: { activity: { eventId: id } } });
    await prisma.activity.deleteMany({ where: { eventId: id } });
    await prisma.track.deleteMany({ where: { eventId: id } });
    await prisma.anchorPoint.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
