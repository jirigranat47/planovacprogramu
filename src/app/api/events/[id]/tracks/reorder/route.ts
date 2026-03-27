import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id: eventId } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Kontrola oprávnění
  const membership = await prisma.eventUser.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: session.user.id
      }
    }
  })

  if (!membership || membership.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { trackIds } = await request.json()
    
    if (!Array.isArray(trackIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Hromadná aktualizace v transakci
    const updates = trackIds.map((id, index) => 
      prisma.track.update({
        where: { id, eventId },
        data: { order: index }
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chyba při přerovnání linek:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
