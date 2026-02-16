
import { prisma } from "@/lib/prisma";
import { getSession as getCookieSession } from "./auth";

/**
 * Retrieves the session from cookies and verifies if the user still exists in the database.
 * This is crucial for handling database resets (which happen frequently in this environment).
 */
export async function getSession() {
    const session = await getCookieSession();
    if (!session) return null;

    if (session?.user?.id) {
        try {
            const userExists = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, username: true, role: true, tenantId: true }
            });

            if (!userExists) {
                // User ID from cookie not found in DB -> Session invalid
                return null;
            }

            // Return fresh data
            session.user = { ...session.user, ...userExists };
        } catch (e) {
            console.error("Error verifying session user:", e);
            // If DB is unreachable, maybe allow session? safer to deny.
            return null;
        }
    }

    return session;
}
