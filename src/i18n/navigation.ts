import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Locale-aware wrappers: hrefs are written without the locale prefix, e.g. "/dashboard". */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
