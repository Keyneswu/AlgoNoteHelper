"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
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
    <div className="flex items-center gap-1" role="group" aria-label={t("language")}>
      <Button
        size="sm"
        variant={current === "en" ? "secondary" : "tertiary"}
        onPress={() => switchTo("en")}
      >
        {t("localeEn")}
      </Button>
      <Button
        size="sm"
        variant={current === "zh-CN" ? "secondary" : "tertiary"}
        onPress={() => switchTo("zh-CN")}
      >
        {t("localeZh")}
      </Button>
    </div>
  );
}
