/** What a person can be open to (P-026, specs/profile-showcase PS-09), in the order shown. */
export const OPEN_TO = [
  'QUESTIONS',
  'COLLABORATIONS',
  'MENTORING',
  'AMAS',
  'COMMISSIONED_ANALYSIS',
] as const

export type OpenTo = (typeof OPEN_TO)[number]

/** Only the values Asinko knows, in their order, once each: anything else is dropped. */
export function knownOpenTo(values: readonly string[] | null | undefined): OpenTo[] {
  return OPEN_TO.filter((value) => values?.includes(value))
}
