import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
    // Na Railway a při buildu se Next.js pokouší instancovat klienta, even if DB is not ready.
    // Dáme mu fallback, aby build nezkolaboval na "undefined" URL.
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "postgresql://not-ready-yet:placeholder@localhost:5432/db"
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
