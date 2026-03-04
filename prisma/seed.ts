import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('marko123', 10)
  
  const marko = await prisma.user.upsert({
    where: { email: 'marko@mbdesign.hr' },
    update: {},
    create: {
      email: 'marko@mbdesign.hr',
      name: 'Marko (Admin)',
      password: hash,
      role: 'ADMIN',
    },
  })

  const omnia = await prisma.user.upsert({
    where: { email: 'user@omnia.hr' },
    update: {},
    create: {
      email: 'user@omnia.hr',
      name: 'Omnia User',
      password: await bcrypt.hash('omnia123', 10),
      role: 'USER',
    },
  })

  console.log({ marko, omnia })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
