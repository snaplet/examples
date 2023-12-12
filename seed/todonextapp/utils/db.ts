import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  log: process.env.DEBUG_PRISMA ? ['query', 'error'] : []
})

export {db}