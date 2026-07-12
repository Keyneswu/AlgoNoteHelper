export const locales = ["en", "zh-CN"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "en";
export const LOCALE_COOKIE = "locale";

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "en" || value === "zh-CN";
}
