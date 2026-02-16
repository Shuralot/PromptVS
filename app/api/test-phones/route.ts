import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const phones = await prisma.testPhone.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(phones);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch test phones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { number, name, tenantId } = body;

        if (!number) {
            return NextResponse.json({ error: 'Number is required' }, { status: 400 });
        }

        const phone = await prisma.testPhone.create({
            data: {
                number,
                name,
                tenantId: tenantId || 'demo-tenant', // Default to demo-tenant for now as seen in simulation page
            }
        });

        return NextResponse.json(phone);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Number already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create test phone' }, { status: 500 });
    }
}
