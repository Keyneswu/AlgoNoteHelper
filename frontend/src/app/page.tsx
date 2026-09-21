import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@heroui/styles";
import { ArrowRight } from "lucide-react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { auth } from "@/lib/auth";
import { getNeedsSetup } from "@/lib/setup-status";

export default async function LandingPage() {
  if (await getNeedsSetup()) {
    redirect("/setup");
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/notes");
  }

  const t = await getTranslations("landing");
  const tCommon = await getTranslations("common");

  return (
    <main className="atmosphere flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-end gap-2 px-5 py-4 sm:px-8">
        <LocaleSwitcher />
        <Link
          href="/login"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          {t("login")}
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pb-20 pt-8 text-center sm:pt-14">
        <section className="flex max-w-2xl flex-col items-center gap-5">
          <p className="text-5xl font-semibold tracking-tight text-accent sm:text-6xl">
            {tCommon("brand")}
          </p>
          <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {t("headline")}
          </h1>
          <p className="max-w-md text-base text-muted sm:text-lg">{t("supporting")}</p>
          <div className="flex flex-col items-center gap-3 pt-1">
            <Link
              href="/login"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              {t("login")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <p className="text-sm text-muted">{t("inviteOnly")}</p>
          </div>
        </section>

        <section className="mt-14 grid w-full max-w-3xl gap-8 text-left sm:mt-16 sm:grid-cols-2 sm:gap-10">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wide text-accent uppercase">
              {t("path1.title")}
            </h2>
            <p className="text-sm leading-relaxed text-muted">{t("path1.blurb")}</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wide text-accent uppercase">
              {t("path2.title")}
            </h2>
            <p className="text-sm leading-relaxed text-muted">{t("path2.blurb")}</p>
          </div>
        </section>

        <section className="mt-14 w-full" aria-labelledby="product-showcase-title">
          <h2 id="product-showcase-title" className="sr-only">
            {t("showcase.title")}
          </h2>

          <figure className="landing-shot landing-shot--primary">
            <figcaption className="landing-shot__label">
              {t("showcase.notes.label")}
            </figcaption>
            <Image
              src="/screenshots/notes.webp"
              alt={t("showcase.notes.alt")}
              width={1900}
              height={1000}
              sizes="(max-width: 768px) 100vw, 1152px"
              preload
              className="landing-shot__image"
            />
          </figure>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <figure className="landing-shot">
              <figcaption className="landing-shot__label">
                {t("showcase.ask.label")}
              </figcaption>
              <Image
                src="/screenshots/ask.webp"
                alt={t("showcase.ask.alt")}
                width={1900}
                height={1000}
                sizes="(max-width: 768px) 100vw, 576px"
                className="landing-shot__image"
              />
            </figure>

            <figure className="landing-shot">
              <figcaption className="landing-shot__label">
                {t("showcase.settings.label")}
              </figcaption>
              <Image
                src="/screenshots/settings.webp"
                alt={t("showcase.settings.alt")}
                width={1900}
                height={1000}
                sizes="(max-width: 768px) 100vw, 576px"
                className="landing-shot__image"
              />
            </figure>
          </div>
        </section>
      </div>
    </main>
  );
}
