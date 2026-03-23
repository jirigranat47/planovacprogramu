import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { startTime, trackId, duration, name, description, category, url, subtasks, responsibleUserIds } = body

    // Ověříme přístup k akci
    const activity = await prisma.activity.findUnique({
      where: { id },
      select: { eventId: true }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const userAccess = await prisma.eventUser.findUnique({
      where: {
        eventId_userId: {
          eventId: activity.eventId,
          userId: session.user.id
        }
      }
    })

    if (!userAccess || userAccess.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update activity and optionally subtasks
    const updatedActivity = await prisma.$transaction(async (tx) => {
      const act = await tx.activity.update({
        where: { id },
        data: {
          name,
          description,
          category,
          url,
          startTime: startTime === null ? null : (startTime ? new Date(startTime) : undefined),
          trackId: trackId === null ? null : (trackId || undefined),
          duration: duration ? parseInt(duration) : undefined,
          responsibleUsers: responsibleUserIds ? {
            set: responsibleUserIds.map((userId: string) => ({ id: userId }))
          } : undefined
        }
      })

      if (subtasks && Array.isArray(subtasks)) {
        // Simple sync: delete all and recreate
        await tx.subtask.deleteMany({ where: { activityId: id } })
        if (subtasks.length > 0) {
          await tx.subtask.createMany({
            data: subtasks.map((st: any) => ({
              text: st.text,
              isDone: st.isDone || false,
              activityId: id
            }))
          })
        }
      }

      return await tx.activity.findUnique({
        where: { id },
        include: { subtasks: true }
      })
    })

    return NextResponse.json(updatedActivity)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
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
    const { id } = await params

    const activity = await prisma.activity.findUnique({
      where: { id },
      select: { eventId: true }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const userAccess = await prisma.eventUser.findUnique({
      where: {
        eventId_userId: {
          eventId: activity.eventId,
          userId: session.user.id
        }
      }
    })

    if (!userAccess || userAccess.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.subtask.deleteMany({ where: { activityId: id } })
    await prisma.activity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}
