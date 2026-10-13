/**
 * Business details the legal pages quote. Fill in the bracketed values before the site is public,
 * then set `reviewed` once the texts have been checked; until then each page shows a draft notice.
 */
export const business = {
  /** The name customers see. */
  brand: "RITMO",
  /** The legal name of the person or company that sells the courses. */
  legalName: "[legal business name]",
  /** Province whose laws govern the terms. */
  province: "[province]",
  /** Where customers send questions, refund requests and privacy requests. */
  email: "[contact email]",
  /** Shown as "Last updated" on every legal page. ISO date. */
  lastUpdated: "2026-10-13",
  reviewed: false,
};

export type Business = typeof business;
