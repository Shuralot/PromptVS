import { prisma } from '@/lib/prisma';

export async function logAudit({
    userId,
    action,
    entity,
    entityId,
    details
}: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
}) {
    try {
        // Double check user exists to prevent FK errors
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            console.warn(`[Audit] Skipped logging for non-existent user: ${userId}`);
            return;
        }

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details
            }
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // We don't want to break the main flow if logging fails, just log the error
    }
}
