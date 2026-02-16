import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    await prisma.testScenario.upsert({
        where: { id: '1' },
        update: {},
        create: {
            id: '1',
            title: 'Angry Customer',
            description: 'Customer demands refund for a delayed order.',
            difficulty: 'Hard',
            personaSystemPrompt: 'You are an angry customer named John. You ordered a laptop 2 weeks ago and it has not arrived. You want a refund immediately. Do not accept store credit.'
        }
    });

    // Create Default Tenant for MVP
    await prisma.tenant.upsert({
        where: { id: 'demo-tenant' },
        update: {},
        create: {
            id: 'demo-tenant',
            name: 'Demo Company',
        }
    });

    await prisma.testScenario.upsert({
        where: { id: '2' },
        update: {},
        create: {
            id: '2',
            title: 'Curious Prospect',
            description: 'Customer asks about pricing and features.',
            difficulty: 'Easy',
            personaSystemPrompt: 'You are a potential customer interested in the AI SaaS. Ask about pricing tiers, API limits, and support. Be polite but skeptical about costs.'
        }
    });

    console.log('Seeding completed.');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
