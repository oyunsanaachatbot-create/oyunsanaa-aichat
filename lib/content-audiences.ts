/** Demographic targeting is separate from a subject TAG and from account/payment roles. */
export const CONTENT_AUDIENCES = {
  ALL_AGES: "Бүх насныханд", CHILD: "Хүүхэд", ADOLESCENT: "Өсвөр үе",
  ADULT: "Насанд хүрэгчид", SENIOR: "Ахмад настан",
  ORGANIZATION: "Байгууллага", CLASS: "Анги, хамт олон",
  SPORTS: "Спортын баг, тамирчид", FAMILY: "Гэр бүл",
} as const;
export const CONTENT_AUDIENCE_CODES = ["ALL_AGES", "CHILD", "ADOLESCENT", "ADULT", "SENIOR", "ORGANIZATION", "CLASS", "SPORTS", "FAMILY"] as const;
export type ContentAudience = (typeof CONTENT_AUDIENCE_CODES)[number];
export const AGE_AUDIENCES = ["CHILD", "ADOLESCENT", "ADULT", "SENIOR"] as const;
export function readContentAudiences(value: unknown): ContentAudience[] {
  return Array.isArray(value) ? [...new Set(value.filter((code): code is ContentAudience => typeof code === "string" && Object.prototype.hasOwnProperty.call(CONTENT_AUDIENCES, code)))] : [];
}
export function toggleContentAudience(values: string[], code: string, checked: boolean): ContentAudience[] {
  let next = values.filter(value => value !== code);
  if (checked) {
    if (code === "ALL_AGES") next = next.filter(value => !(AGE_AUDIENCES as readonly string[]).includes(value));
    if ((AGE_AUDIENCES as readonly string[]).includes(code)) next = next.filter(value => value !== "ALL_AGES");
    next.push(code);
  }
  return readContentAudiences(next);
}
export function contentAudienceMatches(values: string[], selected: string): boolean {
  if (!selected) return true;
  if (selected === "ALL_AGES" || selected === "INDIVIDUAL") return values.some(value => value === "INDIVIDUAL" || value === "ALL_AGES" || (AGE_AUDIENCES as readonly string[]).includes(value));
  if ((AGE_AUDIENCES as readonly string[]).includes(selected)) return values.includes(selected) || values.includes("ALL_AGES");
  return values.includes(selected);
}

export function contentHasOnlyPackages(values: string[] | undefined) {
  return Boolean(values?.length && values.every(code => ["ORGANIZATION", "CLASS", "SPORTS", "FAMILY"].includes(code)));
}
