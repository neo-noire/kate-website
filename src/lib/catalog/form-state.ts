/** Result of an admin form submission. `at` changes on every submit so repeated results show. */
export type FormState = {
  ok?: boolean;
  error?: FormError;
  /** The field the error is about, when there is one. */
  field?: string;
  at?: number;
};

export type FormError =
  | "required"
  | "slug"
  | "slugTaken"
  | "price"
  | "number"
  | "youtube"
  | "email"
  | "userNotFound"
  | "selfDemote"
  | "protectedUser"
  | "tier"
  | "codeTaken"
  | "promoCode"
  | "percent"
  | "noPrograms"
  | "dateOrder"
  | "notFound"
  | "forbidden"
  | "generic";

export const initialFormState: FormState = {};
