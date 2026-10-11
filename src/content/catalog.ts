// Static catalog for the prototype port. IDs are stable and never translated;
// translated copy lives in the dictionaries, keyed by these IDs.

export type DanceId = "cha-cha-cha" | "samba" | "rumba" | "paso-doble" | "jive" | "salsa";
export type ProgramGroup = "intro" | "beginner" | "salsa";
export type ProgramId =
  | "intro-latin-1"
  | "intro-latin-2"
  | "beginner-1"
  | "beginner-2"
  | "beginner-3"
  | "beginner-4"
  | "salsa-essentials";
export type PackageId = "solo" | "personal" | "mentorship";

export type Program = {
  id: ProgramId;
  name: string;
  group: ProgramGroup;
  /** Position within its group, shown on the card artwork. */
  number: string;
  danceIds: DanceId[];
  /** The dance selection still needs confirmation from the coach. */
  provisional?: boolean;
};

export type Package = {
  id: PackageId;
  name: string;
  /** Illustrative prototype price, not a confirmed commercial term. */
  priceEur: number;
  privateLessons: number;
};

export type Lesson = {
  /** 0-based position within a dance; every dance has four lessons. */
  index: number;
  durationMinutes: number;
};

/** Dance names are proper nouns and stay the same in every language. */
export const dances: Record<DanceId, { name: string }> = {
  "cha-cha-cha": { name: "Cha-cha-cha" },
  samba: { name: "Samba" },
  rumba: { name: "Rumba" },
  "paso-doble": { name: "Paso doble" },
  jive: { name: "Jive" },
  salsa: { name: "Salsa" },
};

const introDances: DanceId[] = ["cha-cha-cha", "samba", "rumba"];
const beginnerDances: DanceId[] = ["cha-cha-cha", "samba", "rumba", "paso-doble", "jive"];

export const programs: Program[] = [
  { id: "intro-latin-1", name: "Intro to Latin 1.0", group: "intro", number: "01", danceIds: introDances },
  { id: "intro-latin-2", name: "Intro to Latin 2.0", group: "intro", number: "02", danceIds: introDances, provisional: true },
  { id: "beginner-1", name: "Beginner 1.0", group: "beginner", number: "01", danceIds: beginnerDances },
  { id: "beginner-2", name: "Beginner 2.0", group: "beginner", number: "02", danceIds: beginnerDances },
  { id: "beginner-3", name: "Beginner 3.0", group: "beginner", number: "03", danceIds: beginnerDances },
  { id: "beginner-4", name: "Beginner 4.0", group: "beginner", number: "04", danceIds: beginnerDances },
  { id: "salsa-essentials", name: "Salsa essentials", group: "salsa", number: "01", danceIds: ["salsa"] },
];

export const programGroups: ProgramGroup[] = ["intro", "beginner", "salsa"];

export const packages: Package[] = [
  { id: "solo", name: "Solo", priceEur: 39, privateLessons: 0 },
  { id: "personal", name: "Personal", priceEur: 89, privateLessons: 1 },
  { id: "mentorship", name: "Mentorship", priceEur: 219, privateLessons: 4 },
];

export const lessons: Lesson[] = [
  { index: 0, durationMinutes: 18 },
  { index: 1, durationMinutes: 24 },
  { index: 2, durationMinutes: 22 },
  { index: 3, durationMinutes: 20 },
];

export const LESSONS_PER_DANCE = lessons.length;
export const PRIVATE_LESSON_MINUTES = 50;
export const lowestPriceEur = Math.min(...packages.map((p) => p.priceEur));

export function getProgram(id: string): Program | undefined {
  return programs.find((p) => p.id === id);
}

export function getPackage(id: string): Package | undefined {
  return packages.find((p) => p.id === id);
}

export function programHasDance(program: Program, danceId: string): danceId is DanceId {
  return (program.danceIds as string[]).includes(danceId);
}

/** A course is one dance within one program, e.g. "intro-latin-1/samba". */
export type CourseKey = `${ProgramId}/${DanceId}`;

export function courseKey(programId: ProgramId, danceId: DanceId): CourseKey {
  return `${programId}/${danceId}`;
}

export function parseCourseKey(key: string): { program: Program; danceId: DanceId } | undefined {
  const [programId, danceId] = key.split("/");
  const program = getProgram(programId);
  if (!program || !programHasDance(program, danceId)) return undefined;
  return { program, danceId };
}

export const DEFAULT_COURSE: CourseKey = "intro-latin-1/cha-cha-cha";
