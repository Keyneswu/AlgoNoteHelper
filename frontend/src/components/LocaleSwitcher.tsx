"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { LOCALE_COOKIE, type AppLocale, isAppLocale } from "@/i18n/config";

function setLocaleCookie(locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${maxAge};samesite=lax`;
}

export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const current: AppLocale = isAppLocale(locale) ? locale : "en";

  function switchTo(next: AppLocale) {
    if (next === current) return;
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <ToggleButtonGroup
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={new Set([current])}
      onSelectionChange={(keys) => {
        const selected = [...keys][0];
        if (typeof selected === "string" && isAppLocale(selected)) {
          switchTo(selected);
        }
      }}
      aria-label={t("language")}
    >
      <ToggleButton id="en">{t("localeEn")}</ToggleButton>
      <ToggleButton id="zh-CN">{t("localeZh")}</ToggleButton>
    </ToggleButtonGroup>
  );
}
