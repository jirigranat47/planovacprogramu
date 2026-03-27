import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// Úprava linky
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const track = await prisma.track.findUnique({
      where: { id },
      include: { event: { include: { users: true } } }
    })

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const membership = track.event.users.find(u => u.userId === session?.user?.id)
    if (!membership || membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, color, order } = await request.json()
    const updated = await prisma.track.update({
      where: { id },
      data: { name, color, order }
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Smazání linky
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const track = await prisma.track.findUnique({
      where: { id },
      include: { 
        event: { include: { users: true } },
        activities: true
      }
    })

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const membership = track.event.users.find(u => u.userId === session?.user?.id)
    if (!membership || membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Pokud linka obsahuje aktivity, nejprve je přesuneme do zásobníku (trackId = null)
    if (track.activities.length > 0) {
      await prisma.activity.updateMany({
        where: { trackId: id },
        data: { trackId: null, startTime: null }
      })
    }

    await prisma.track.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chyba při mazání linky:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
