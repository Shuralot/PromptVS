import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100, // Limit to last 100 entries for performance
            include: {
                user: {
                    select: { username: true }
                }
            }
        });

        return NextResponse.json(logs);
    } catch (e) {
        console.error("Failed to fetch audit logs", e);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
