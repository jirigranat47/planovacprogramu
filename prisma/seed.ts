import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  // Vyčistíme stará data
  await prisma.subtask.deleteMany({})
  await prisma.activity.deleteMany({})
  await prisma.track.deleteMany({})
  await prisma.anchorPoint.deleteMany({})
  await prisma.event.deleteMany({})

  // Vytvoříme testovací akci
  const event = await prisma.event.create({
    data: {
      name: "Výprava do skal",
      startTime: new Date("2026-04-10T17:00:00Z"),
      endTime: new Date("2026-04-12T14:00:00Z"),
      description: "Tradiční jarní víkendovka",
      tracks: {
        create: [
          { name: "Vlčata", color: "#3B82F6" },
          { name: "Skauti", color: "#10B981" },
          { name: "Roveři", color: "#8B5CF6" }
        ]
      }
    },
    include: { tracks: true }
  })

  // @ts-ignore
  const trackVlcata = event.tracks.find((t: any) => t.name === "Vlčata")!

  // Vytvoříme testovací aktivity (v programu)
  await prisma.activity.create({
    data: {
      name: "Úvodní hra",
      startTime: new Date("2026-04-10T18:00:00Z"),
      duration: 120,
      description: "Seznamovací hry na louce",
      trackId: trackVlcata.id,
      eventId: event.id,
      category: "Program",
      subtasks: {
        create: [
          { text: "Připravit lana" },
          { text: "Rozdat šátky" }
        ]
      }
    }
  })

  // Vytvoříme aktivitu v zásobníku (bez trackId a startTime)
  await prisma.activity.create({
    data: {
      name: "Večerní oheň",
      duration: 60,
      description: "Zpívání u ohně",
      eventId: event.id,
      category: "Společné"
    }
  })

  console.log('Seedování dokončeno.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
