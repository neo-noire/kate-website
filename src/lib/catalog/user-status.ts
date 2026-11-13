/** The status shown for an account: deleted beats deactivated beats active. */
export function userStatus(user: { deactivatedAt: Date | null; deletedAt: Date | null }) {
  return user.deletedAt ? "deleted" : user.deactivatedAt ? "deactivated" : "active";
}
