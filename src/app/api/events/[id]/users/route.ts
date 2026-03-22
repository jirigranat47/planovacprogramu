import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Získat uživatele přiřazené k akci
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    // Musíme být alespoň v týmu, abychom viděli ostatní
    const userAccess = await prisma.eventUser.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.user.id
        }
      }
    })

    if (!userAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const eventUsers = await prisma.eventUser.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    })

    return NextResponse.json(eventUsers)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch event users' }, { status: 500 })
  }
}

// Přidání nebo úprava uživatele na akci
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: eventId } = await params
    const { email, role = 'EDITOR' } = await request.json()

    // Ověřit, že aktuálně přihlášený je OWNER
    const currentUserAccess = await prisma.eventUser.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: session.user.id
        }
      }
    })

    if (!currentUserAccess || currentUserAccess.role !== 'OWNER') {
      return NextResponse.json({ error: 'Jen vlastníci mohou spravovat přístupy k akci.' }, { status: 403 })
    }

    // Najdeme uživatele podle emailu
    const targetUser = await prisma.user.findUnique({ where: { email } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Uživatel s tímto emailem neexistuje.' }, { status: 404 })
    }

    // Upsert v EventUser
    const eventUser = await prisma.eventUser.upsert({
      where: {
        eventId_userId: { eventId, userId: targetUser.id }
      },
      update: { role },
      create: {
        eventId,
        userId: targetUser.id,
        role
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } }
      }
    })

    return NextResponse.json(eventUser)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to add event user' }, { status: 500 })
  }
}
