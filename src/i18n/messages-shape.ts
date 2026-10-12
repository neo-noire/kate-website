import type en from "../../messages/en.json";
import type uk from "../../messages/uk.json";

// Type-only check that every locale has exactly the English message keys.
// A missing or extra key in messages/uk.json fails `npm run typecheck`.
type Keys<T> = T extends string ? never : { [K in keyof T]: K extends string ? K | `${K}.${Keys<T[K]> & string}` : never }[keyof T];
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const ukMatchesEn: Equal<Keys<typeof en>, Keys<typeof uk>> = true;
