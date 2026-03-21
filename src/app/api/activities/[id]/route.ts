import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { startTime, trackId, duration, name, description, category } = body

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        name,
        description,
        category,
        startTime: startTime === null ? null : (startTime ? new Date(startTime) : undefined),
        trackId: trackId === null ? null : (trackId || undefined),
        duration: duration ? parseInt(duration) : undefined
      }
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
