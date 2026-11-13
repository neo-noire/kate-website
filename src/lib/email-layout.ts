/**
 * The look shared by every email: the site's dark red theme as table-based HTML with inline styles,
 * which is what mail clients render reliably. The same content also becomes the plain-text version.
 */

const COLOR = {
  page: "#101010",
  card: "#191919",
  line: "#303030",
  muted: "#aaa7a4",
  text: "#f7f3ee",
  red: "#ed342d",
};
const FONT = "Arial, Helvetica, sans-serif";

export type EmailContent = {
  /** The language of the email, for the page's `lang` attribute. */
  lang: string;
  /** The title of the email, also used as the page title. */
  heading: string;
  paragraphs?: string[];
  /** A one-time code, shown large. */
  code?: string;
  /** Label and value pairs, e.g. what was bought. */
  details?: [label: string, value: string][];
  /** A quoted text from someone else, kept with its line breaks. */
  quote?: string;
  button?: { label: string; url: string };
  /** Small print under the card. */
  footer?: string;
};

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Both versions of an email, built from the same content so they can't drift apart. */
export function renderEmail(content: EmailContent) {
  return { text: renderText(content), html: renderHtml(content) };
}

function renderText({ heading, paragraphs = [], code, details = [], quote, button, footer }: EmailContent) {
  return [
    heading,
    ...paragraphs,
    code,
    details.length ? details.map(([label, value]) => `${label}: ${value}`).join("\n") : undefined,
    quote,
    button ? `${button.label}: ${button.url}` : undefined,
    footer,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function renderHtml({ lang, heading, paragraphs = [], code, details = [], quote, button, footer }: EmailContent) {
  const text = (html: string, style = "") =>
    `<p style="margin:0 0 16px;font:15px/1.6 ${FONT};color:${COLOR.text};${style}">${html}</p>`;

  const body = [
    `<h1 style="margin:0 0 20px;font:bold 24px/1.25 ${FONT};color:${COLOR.text};letter-spacing:-0.5px;">${escapeHtml(heading)}</h1>`,
    ...paragraphs.map((paragraph) => text(escapeHtml(paragraph))),
    code &&
      `<div style="margin:8px 0 24px;padding:18px 12px;background:${COLOR.page};border:1px solid ${COLOR.line};border-radius:6px;text-align:center;font:bold 34px/1 'Courier New', monospace;letter-spacing:10px;color:${COLOR.red};">${escapeHtml(code)}</div>`,
    details.length &&
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-top:1px solid ${COLOR.line};">${details
        .map(
          ([label, value]) =>
            `<tr><td style="padding:10px 0;border-bottom:1px solid ${COLOR.line};font:13px ${FONT};color:${COLOR.muted};">${escapeHtml(label)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid ${COLOR.line};font:bold 14px ${FONT};color:${COLOR.text};">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}</table>`,
    quote &&
      `<div style="margin:8px 0 24px;padding:4px 0 4px 16px;border-left:3px solid ${COLOR.red};font:15px/1.6 ${FONT};color:${COLOR.text};white-space:pre-wrap;">${escapeHtml(quote)}</div>`,
    button &&
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0;"><tr><td bgcolor="${COLOR.red}" style="background:${COLOR.red};border-radius:6px;"><a href="${escapeHtml(button.url)}" style="display:inline-block;padding:14px 28px;font:bold 15px ${FONT};color:#ffffff;text-decoration:none;">${escapeHtml(button.label)}</a></td></tr></table>`,
  ]
    .filter(Boolean)
    .join("\n");

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${COLOR.page}" style="background:${COLOR.page};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 0 20px;font:900 28px ${FONT};letter-spacing:-1.5px;color:${COLOR.text};">Latin<span style="color:${COLOR.red};">Kate</span></td></tr>
<tr><td bgcolor="${COLOR.card}" style="background:${COLOR.card};border:1px solid ${COLOR.line};border-top:3px solid ${COLOR.red};border-radius:8px;padding:32px;">
${body}
</td></tr>
${footer ? `<tr><td style="padding:20px 8px 0;font:12px/1.5 ${FONT};color:${COLOR.muted};">${escapeHtml(footer)}</td></tr>` : ""}
</table>
</td></tr>
</table>
</body>
</html>`;
}
