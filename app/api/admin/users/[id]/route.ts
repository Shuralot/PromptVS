import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const { id } = await params;

    try {
        await prisma.user.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const { id } = await params;
    const { role } = await request.json();

    try {
        const user = await prisma.user.update({
            where: { id },
            data: { role }
        });
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }
}
