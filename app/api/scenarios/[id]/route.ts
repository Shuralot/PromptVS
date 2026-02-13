import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { title, description, personaSystemPrompt, difficulty } = body;

        const updated = await prisma.testScenario.update({
            where: { id },
            data: {
                title,
                description,
                personaSystemPrompt,
                difficulty
            }
        });

        return NextResponse.json(updated);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update scenario' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Note: This might fail if there are active sessions using this scenario.
        // In a real app we'd handle foreign key constraints gracefully.
        await prisma.testScenario.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete scenario. It might be in use.' }, { status: 500 });
    }
}
