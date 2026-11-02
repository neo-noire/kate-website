/** draft: only admins see it. coming_soon: shown on the home page but not open. published: open to everyone. */
export const PROGRAM_STATUSES = ["draft", "coming_soon", "published"] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

/** The admin message key that names each status. */
export const STATUS_LABEL = { draft: "draft", coming_soon: "comingSoon", published: "published" } as const;
