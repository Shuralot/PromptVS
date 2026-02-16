import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export async function GET() {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        where: { tenantId: session.user.tenantId },
        select: { id: true, username: true, role: true, createdAt: true }
    });

    return NextResponse.json(users);
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const { username, password, role } = await req.json();

    if (!username || !password) {
        return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: role || 'USER',
                tenantId: session.user.tenantId
            }
        });

        return NextResponse.json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
        return NextResponse.json({ error: 'Usuário já existe' }, { status: 400 });
    }
}
