import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await prisma.testSession.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' }
                },
                report: true,
                scenario: true
            }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error("Session Fetch Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
