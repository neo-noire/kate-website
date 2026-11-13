import "server-only";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  account,
  contactMessage,
  lessonNote,
  lessonProgress,
  newsletterSubscriber,
  session,
  user,
  verification,
} from "@/db/schema";

/**
 * Stops an account from signing in. Its sessions are deleted in the same step, and the sign-in
 * hook in src/lib/auth/server.ts refuses new ones, so nothing stays signed in.
 */
export async function deactivateUser(userId: string, reason: string | null) {
  await db.transaction(async (tx) => {
    await tx.update(user).set({ deactivatedAt: new Date(), deactivationReason: reason, updatedAt: new Date() }).where(eq(user.id, userId));
    await tx.delete(session).where(eq(session.userId, userId));
  });
}

export async function reactivateUser(userId: string) {
  await db.update(user).set({ deactivatedAt: null, deactivationReason: null, updatedAt: new Date() }).where(eq(user.id, userId));
}

/**
 * Deletes a person's data but keeps the account row and its purchases: refunds, disputes and the
 * sales record still need them. Name and email are replaced, so the address can sign up again.
 */
export async function anonymizeUser(userId: string) {
  await db.transaction(async (tx) => {
    const [row] = await tx.select({ email: user.email }).from(user).where(eq(user.id, userId));
    if (!row) return;
    await tx.delete(session).where(eq(session.userId, userId));
    await tx.delete(account).where(eq(account.userId, userId));
    await tx.delete(lessonProgress).where(eq(lessonProgress.userId, userId));
    await tx.delete(lessonNote).where(eq(lessonNote.userId, userId));
    await tx.delete(verification).where(eq(verification.identifier, row.email));
    await tx.delete(newsletterSubscriber).where(eq(newsletterSubscriber.email, row.email));
    await tx.delete(contactMessage).where(or(eq(contactMessage.userId, userId), eq(contactMessage.email, row.email)));
    const now = new Date();
    await tx
      .update(user)
      .set({
        name: "Deleted user",
        email: `deleted-${userId}@deleted.invalid`,
        emailVerified: false,
        image: null,
        role: "student",
        deactivatedAt: now,
        deactivationReason: null,
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(user.id, userId));
  });
}
