/**
 * The connection string with the SSL modes `pg` is about to redefine (require, prefer, verify-ca)
 * spelled `verify-full`, which is what `pg` already treats them as. The Vercel Neon integration
 * writes `sslmode=require` and can't be edited, so this keeps today's behaviour and silences the warning.
 * @param {string | undefined} url
 */
export function connectionString(url) {
  return url?.replace(/([?&]sslmode=)(require|prefer|verify-ca)(?=&|$)/, "$1verify-full");
}
