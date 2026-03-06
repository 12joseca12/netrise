import type { Locale, LiteralsMap } from "./types";
import { es } from "./es";
import { en } from "./en";

export type { LiteralsMap, Locale } from "./types";
export { es, en };

export const literals: Record<Locale, LiteralsMap> = { es, en };
