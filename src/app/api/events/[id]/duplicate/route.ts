import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Najít původní akci se všemi daty
    const originalEvent = await prisma.event.findUnique({
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
          where: { trackId: null },
          include: {
            subtasks: true
          }
        }
      }
    })

    if (!originalEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // 2. Vytvořit novou akci (kopii)
    const newEvent = await prisma.event.create({
      data: {
        name: `${originalEvent.name} (kopie)`,
        startTime: originalEvent.startTime,
        endTime: originalEvent.endTime,
        description: originalEvent.description,
        isArchived: false,
        users: {
          create: {
            userId: session.user.id,
            role: 'OWNER'
          }
        }
      }
    })

    // 3. Duplikovat linky a jejich aktivity
    for (const track of originalEvent.tracks) {
      const newTrack = await prisma.track.create({
        data: {
          name: track.name,
          color: track.color,
          eventId: newEvent.id
        }
      })

      for (const activity of track.activities) {
        await prisma.activity.create({
          data: {
            name: activity.name,
            startTime: activity.startTime,
            duration: activity.duration,
            description: activity.description,
            url: activity.url,
            category: activity.category,
            eventId: newEvent.id,
            trackId: newTrack.id,
            subtasks: {
              create: activity.subtasks.map(s => ({
                text: s.text,
                isDone: s.isDone
              }))
            }
          }
        })
      }
    }

    // 4. Duplikovat aktivity v zásobníku
    for (const activity of originalEvent.activities) {
      await prisma.activity.create({
        data: {
          name: activity.name,
          startTime: null,
          duration: activity.duration,
          description: activity.description,
          url: activity.url,
          category: activity.category,
          eventId: newEvent.id,
          trackId: null,
          subtasks: {
            create: activity.subtasks.map(s => ({
              text: s.text,
              isDone: s.isDone
            }))
          }
        }
      })
    }

    return NextResponse.json(newEvent)
  } catch (error) {
    console.error('Chyba při duplikaci:', error)
    return NextResponse.json({ error: 'Failed to duplicate event' }, { status: 500 })
  }
}
