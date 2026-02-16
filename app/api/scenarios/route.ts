import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const scenarios = await prisma.testScenario.findMany({
            orderBy: { title: 'asc' },
            include: { createdBy: { select: { username: true } } }
        });
        return NextResponse.json(scenarios);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { title, description, personaSystemPrompt, difficulty } = body;

        if (!title || !personaSystemPrompt) {
            return NextResponse.json({ error: 'Title and System Prompt are required' }, { status: 400 });
        }

        const scenario = await prisma.testScenario.create({
            data: {
                title,
                description: description || '',
                personaSystemPrompt,
                difficulty: difficulty || 'Medium',
                createdById: session.user.id
            }
        });

        await logAudit({
            userId: session.user.id,
            action: 'CREATE',
            entity: 'TestScenario',
            entityId: scenario.id,
            details: `Created scenario: ${title}`
        });

        return NextResponse.json(scenario);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
    }
}
