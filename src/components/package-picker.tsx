import Link from "next/link";
import { dances, packages, PRIVATE_LESSON_MINUTES, type DanceId, type Program } from "@/content/catalog";
import { format, formatEuro, plural } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { EnrollButton } from "./enroll-button";

/** Dance tabs and the three packages for one dance of a program. */
export async function PackagePicker({ program, danceId }: { program: Program; danceId: DanceId }) {
  const { locale, dict } = await getDictionary();
  const t = dict.packages;
  const danceCount = program.danceIds.length;

  return (
    <main className="section wrap packagesPage">
      <Link className="backLink" href={`/${locale}#courses`}>
        {t.back}
      </Link>
      <div className="eyebrow">{t.eyebrow}</div>
      <h1>{program.name}</h1>
      <p className="sub">{danceCount === 1 ? t.summaryOne : format(t.summary, { count: danceCount })}</p>
      <div className="danceTabs">
        {program.danceIds.map((id) => (
          <Link
            key={id}
            className={`chip${id === danceId ? " active" : ""}`}
            aria-current={id === danceId ? "page" : undefined}
            href={`/${locale}/programs/${program.id}/${id}`}
            scroll={false}
          >
            {dances[id].name}
          </Link>
        ))}
      </div>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>
        {dances[danceId].name}{" "}
        <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: "normal" }}>{t.perDance}</span>
      </h2>
      <div className="planGrid">
        {packages.map((pkg, i) => {
          const featured = i === 1;
          const items = [
            t.videoLessons,
            ...(pkg.privateLessons
              ? [plural(locale, pkg.privateLessons, t.privateLessons, { minutes: PRIVATE_LESSON_MINUTES })]
              : []),
            ...t.items[pkg.id],
          ];
          return (
            <div className={`plan${featured ? " featured" : ""}`} key={pkg.id}>
              <span className="eyebrow">{featured ? t.featured : format(t.format, { number: i + 1 })}</span>
              <h3>{pkg.name}</h3>
              <div className="price">
                {formatEuro(locale, pkg.priceEur)} <small>{t.perCourse}</small>
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
        {t.fine}
        {program.provisional ? t.provisional : ""}
      </p>
    </main>
  );
}
