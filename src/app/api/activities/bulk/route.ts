import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { activities } = await request.json()
    
    // Ošetření prázdného listu
    if (!activities || !Array.isArray(activities)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Vytvoříme pole prisma update příkazů
    const updates = activities.map((act: any) => {
      const dataToUpdate: any = {}
      if (act.startTime !== undefined) dataToUpdate.startTime = act.startTime ? new Date(act.startTime) : null
      if (act.trackId !== undefined) dataToUpdate.trackId = act.trackId
      if (act.duration !== undefined) dataToUpdate.duration = parseInt(act.duration)
      
      return prisma.activity.update({
        where: { id: act.id },
        data: dataToUpdate
      })
    })

    // Spustíme v jediné transakci pro zachování atomicity
    await prisma.$transaction(updates)

    return NextResponse.json({ success: true, updatedCount: updates.length })
  } catch (error) {
    console.error('API Error Bulk Update:', error)
    return NextResponse.json({ error: 'Failed to bulk update activities' }, { status: 500 })
  }
}
