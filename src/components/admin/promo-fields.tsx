import { getTranslations } from "next-intl/server";
import { CheckboxField, SelectField, TextField } from "./forms";
import type { AdminPromoCode } from "@/lib/catalog/admin-queries";
import { CURRENCIES } from "@/lib/money";

type PromoFieldsProps = {
  programs: { id: string; title: string }[];
  item?: AdminPromoCode;
};

/** A date as the value of a date input. */
const dateValue = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 10) : "");

/** The fields of the promo code form, shared by "New code" and "Edit code". */
export async function PromoFields({ programs, item }: PromoFieldsProps) {
  const t = await getTranslations("admin.promo.fields");
  const isFixed = item?.amountOffCents != null;

  return (
    <>
      <TextField name="code" label={t("code")} hint={t("codeHint")} defaultValue={item?.code} required />
      <SelectField
        name="type"
        label={t("type")}
        defaultValue={isFixed ? "fixed" : "percent"}
        options={[
          { value: "percent", label: t("percent") },
          { value: "fixed", label: t("fixed") },
        ]}
      />
      <div className="adminRow">
        <TextField name="percentOff" label={t("percentOff")} hint={t("percentHint")} type="number" defaultValue={item?.percentOff} />
        <TextField
          name="amount"
          label={t("amount")}
          hint={t("amountHint")}
          inputMode="decimal"
          defaultValue={item?.amountOffCents != null ? (item.amountOffCents / 100).toFixed(item.amountOffCents % 100 ? 2 : 0) : ""}
        />
        <SelectField
          name="currency"
          label={t("currency")}
          defaultValue={item?.currency ?? undefined}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
      </div>
      <p className="m-0 -mt-2 text-xs text-muted-foreground">{t("currencyHint")}</p>
      <div className="adminRow">
        <TextField name="startsAt" label={t("startsAt")} type="date" defaultValue={dateValue(item?.startsAt)} />
        <TextField name="expiresAt" label={t("expiresAt")} type="date" defaultValue={dateValue(item?.expiresAt)} hint={t("datesHint")} />
      </div>
      <div className="adminRow">
        <TextField name="maxRedemptions" label={t("maxRedemptions")} hint={t("maxHint")} type="number" defaultValue={item?.maxRedemptions} />
        <TextField name="perUserLimit" label={t("perUser")} type="number" defaultValue={item?.perUserLimit ?? 1} />
      </div>
      <fieldset className="m-0 grid gap-2.5 rounded-lg border border-border p-4">
        <legend className="px-1 text-xs text-muted-foreground">{t("programs")}</legend>
        <CheckboxField name="allPrograms" label={t("allPrograms")} defaultChecked={item?.allPrograms} />
        {programs.map((program) => (
          <CheckboxField
            key={program.id}
            name="programId"
            value={program.id}
            label={program.title}
            defaultChecked={item?.programIds.includes(program.id)}
          />
        ))}
      </fieldset>
      <CheckboxField name="active" label={t("active")} defaultChecked={item?.active ?? true} />
    </>
  );
}
