import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { startTime, trackId, duration } = body

    const dataToUpdate: any = {}
    if (startTime !== undefined) dataToUpdate.startTime = startTime ? new Date(startTime) : null
    if (trackId !== undefined) dataToUpdate.trackId = trackId
    if (duration !== undefined) dataToUpdate.duration = parseInt(duration)

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: dataToUpdate
    })

    return NextResponse.json(updatedActivity)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}
