export const LEGAL_DOCS = ["terms", "privacy", "refunds"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

/** A paragraph, or a bulleted list when it is an array. */
export type LegalBlock = string | string[];

export type LegalSection = { heading: string; body: LegalBlock[] };

export type LegalDocument = { title: string; intro: string; sections: LegalSection[] };
