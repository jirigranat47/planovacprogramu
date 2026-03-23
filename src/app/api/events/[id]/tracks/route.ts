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
    const { name, color } = await request.json()
    const track = await prisma.track.create({
      data: {
        name: name || 'Nová linka',
        color: color || '#3b82f6',
        eventId
      }
    })
    return NextResponse.json(track)
  } catch (error) {
    console.error('Chyba při vytváření linky:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
