import Link from "next/link";
import {useTranslations} from "next-intl";

import {Container} from "./Container";

const footerLinks = [
  {href: "#", key: "privacy"},
  {href: "#", key: "terms"},
  {href: "#", key: "contact"},
  {href: "#", key: "help"}
] as const;

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="pb-6">
      <Container>
        <div className="flex mt-6 flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground lg:flex-row lg:text-left">
          <p className="font-semibold tracking-tight text-foreground">{t("nav.brand")}</p>

          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
            {footerLinks.map((item) => (
              <Link key={item.key} href={item.href} className="transition-colors hover:text-foreground">
                {t(`footer.${item.key}`)}
              </Link>
            ))}
          </nav>

          <p>{t("footer.copyright")}</p>
        </div>
      </Container>
    </footer>
  );
}

