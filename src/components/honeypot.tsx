/** A field people never see or fill in; bots that fill every field reveal themselves. */
export function Honeypot() {
  return (
    <label className="honeypot" aria-hidden="true">
      Website
      <input name="website" tabIndex={-1} autoComplete="off" />
    </label>
  );
}
