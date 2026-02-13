import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const scenarios = await prisma.testScenario.findMany({
            orderBy: { title: 'asc' }
        });
        return NextResponse.json(scenarios);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
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
                difficulty: difficulty || 'Medium'
            }
        });

        return NextResponse.json(scenario);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
    }
}
