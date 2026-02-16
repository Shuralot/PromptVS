import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.testPhone.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete test phone' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { number, name } = body;

        const phone = await prisma.testPhone.update({
            where: { id },
            data: { number, name }
        });

        return NextResponse.json(phone);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update test phone' }, { status: 500 });
    }
}
