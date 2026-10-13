import { business } from "./business";
import { englishLegal } from "./en";
import type { LegalDoc, LegalDocument } from "./types";
import { ukrainianLegal } from "./uk";

export { business } from "./business";
export { LEGAL_DOCS, type LegalBlock, type LegalDoc, type LegalDocument } from "./types";

// To add a language, add a translation next to en.ts and list it here. Missing languages show English.
const translations: Record<string, Record<LegalDoc, LegalDocument>> = {
  en: englishLegal(business),
  uk: ukrainianLegal(business),
};

export function getLegalDocument(locale: string, doc: LegalDoc): LegalDocument {
  return (translations[locale] ?? translations.en)[doc];
}
