import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        // 1. Check for master admin from .env
        const masterPassword = process.env.ADMIN_PASSWORD || 'admin123';
        if (username === 'admin' && password === masterPassword) {
            // Check if tenant exists, otherwise use 'demo-tenant'
            let tenant = await prisma.tenant.findFirst();
            if (!tenant) {
                tenant = await prisma.tenant.create({ 
                    data: { id: 'demo-tenant', name: 'Demo Tenant' } 
                });
            }

            // Check if user 'admin' exists in DB to get an ID, or create a virtual session
            let user = await prisma.user.findUnique({ where: { username: 'admin' } });
            if (!user) {
                // We create it if it doesn't exist so we have a valid ID for audit
                const hashedPassword = await bcrypt.hash(masterPassword, 10);
                user = await prisma.user.create({
                    data: {
                        username: 'admin',
                        password: hashedPassword,
                        role: 'ADMIN',
                        tenantId: tenant.id
                    }
                });
            }

            await login(user);
            return NextResponse.json({ success: true });
        }

        // 2. Check DB for other users
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
        }

        // 3. Create session
        await login(user);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
