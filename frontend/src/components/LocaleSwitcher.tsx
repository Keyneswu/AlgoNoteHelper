"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, Dropdown, Label } from "@heroui/react";
import { Languages } from "lucide-react";
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
    <Dropdown>
      <Button
        size="sm"
        variant="tertiary"
        isIconOnly
        aria-label={t("language")}
      >
        <Languages className="size-4" aria-hidden />
      </Button>
      <Dropdown.Popover placement="bottom" className="min-w-32">
        <Dropdown.Menu
          aria-label={t("language")}
          selectionMode="single"
          selectedKeys={new Set([current])}
          onAction={(key) => {
            if (typeof key === "string" && isAppLocale(key)) {
              switchTo(key);
            }
          }}
        >
          <Dropdown.Item id="en" textValue={t("localeEn")}>
            <Label>{t("localeEn")}</Label>
            <Dropdown.ItemIndicator />
          </Dropdown.Item>
          <Dropdown.Item id="zh-CN" textValue={t("localeZh")}>
            <Label>{t("localeZh")}</Label>
            <Dropdown.ItemIndicator />
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
