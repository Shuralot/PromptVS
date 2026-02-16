import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const isBrowser = typeof window !== 'undefined'

const createPrismaClient = () => {
    if (isBrowser) return null as any
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production' && !isBrowser) {
    globalForPrisma.prisma = prisma
}
