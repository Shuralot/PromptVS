import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
                difficulty,
                updatedById: session.user.id
            }
        });

        await logAudit({
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'TestScenario',
            entityId: id,
            details: `Updated scenario: ${title}`
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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        
        // Fetch for log
        const scenario = await prisma.testScenario.findUnique({ where: { id } });

        await prisma.testScenario.delete({
            where: { id }
        });

        if (scenario) {
            await logAudit({
                userId: session.user.id,
                action: 'DELETE',
                entity: 'TestScenario',
                entityId: id,
                details: `Deleted scenario: ${scenario.title}`
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete scenario. It might be in use.' }, { status: 500 });
    }
}
