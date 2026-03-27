import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// Přidání nové linky k akci
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id: eventId } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Kontrola oprávnění (musí být v týmu akce a nebýt VIEWER)
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
    console.log('Adding track for event:', eventId)
    
    // Zjistíme nejvyšší aktuální 'order'
    const maxOrder = await prisma.track.aggregate({
      where: { eventId },
      _max: { order: true }
    })

    const nextOrder = (maxOrder._max?.order ?? -1) + 1
    console.log('Next track order:', nextOrder)

    const track = await prisma.track.create({
      data: {
        name: 'Nová linka',
        color: '#3B82F6',
        order: nextOrder,
        eventId
      }
    })

    return NextResponse.json(track)
  } catch (error: any) {
    console.error('Detailed API Error during Track Creation:', error)
    return NextResponse.json({ 
      error: 'Failed to create track',
      details: error.message,
      prismaError: {
        message: error.message,
        code: error.code,
        meta: error.meta
      }
    }, { status: 500 })
  }
}
