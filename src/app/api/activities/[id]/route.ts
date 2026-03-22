import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { startTime, trackId, duration, name, description, category, url, subtasks } = body

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
          duration: duration ? parseInt(duration) : undefined
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
  try {
    const { id } = await params
    await prisma.subtask.deleteMany({ where: { activityId: id } })
    await prisma.activity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}
