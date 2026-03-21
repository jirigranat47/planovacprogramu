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

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        startTime: startTime ? new Date(startTime) : null,
        trackId: trackId || null,
        duration: duration ? parseInt(duration) : undefined
      }
    })

    return NextResponse.json(updatedActivity)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}
