import { getFormatter, getTranslations } from "next-intl/server";
import { dances, packages, PRIVATE_LESSON_MINUTES, type DanceId, type PackageId, type Program } from "@/content/catalog";
import { Link } from "@/i18n/navigation";
import { EnrollButton } from "./enroll-button";

/** Message keys for each package's extra benefits, after its lessons. */
const packageItems = {
  solo: ["solo.access", "solo.pace"],
  personal: ["personal.feedback"],
  mentorship: ["mentorship.guidance"],
} as const satisfies Record<PackageId, readonly string[]>;

/** Dance tabs and the three packages for one dance of a program. */
export async function PackagePicker({ program, danceId }: { program: Program; danceId: DanceId }) {
  const t = await getTranslations("packages");
  const format = await getFormatter();

  return (
    <main className="section wrap packagesPage">
      <Link className="backLink" href="/#courses">
        {t("back")}
      </Link>
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{program.name}</h1>
      <p className="sub">{t("summary", { count: program.danceIds.length })}</p>
      <div className="danceTabs">
        {program.danceIds.map((id) => (
          <Link
            key={id}
            className={`chip${id === danceId ? " active" : ""}`}
            aria-current={id === danceId ? "page" : undefined}
            href={`/programs/${program.id}/${id}`}
            scroll={false}
          >
            {dances[id].name}
          </Link>
        ))}
      </div>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>
        {dances[danceId].name}{" "}
        <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: "normal" }}>{t("perDance")}</span>
      </h2>
      <div className="planGrid">
        {packages.map((pkg, i) => {
          const featured = i === 1;
          const items = [
            t("videoLessons"),
            ...(pkg.privateLessons ? [t("privateLessons", { count: pkg.privateLessons, minutes: PRIVATE_LESSON_MINUTES })] : []),
            ...packageItems[pkg.id].map((key) => t(`items.${key}`)),
          ];
          return (
            <div className={`plan${featured ? " featured" : ""}`} key={pkg.id}>
              <span className="eyebrow">{featured ? t("featured") : t("format", { number: i + 1 })}</span>
              <h3>{pkg.name}</h3>
              <div className="price">
                {format.number(pkg.priceEur, "eur")} <small>{t("perCourse")}</small>
              </div>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <EnrollButton programId={program.id} danceId={danceId} packageId={pkg.id} featured={featured} />
            </div>
          );
        })}
      </div>
      <p className="fine">
        {t("fine")}
        {program.provisional ? t("provisional") : ""}
      </p>
    </main>
  );
}
