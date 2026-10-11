import type { Locale } from "../config";
import en, { type Dictionary } from "./en";
import uk from "./uk";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { en, uk };
