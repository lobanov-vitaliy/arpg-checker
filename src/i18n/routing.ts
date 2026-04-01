import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ua", "es", "pl", "de", "fr"],
  defaultLocale: "en",
});
