/** Request headers for code under test; set with `setTestHeaders`. */
let current = new Headers();
export function setTestHeaders(init: Record<string, string>) {
  current = new Headers(init);
}
export async function headers() {
  return current;
}
