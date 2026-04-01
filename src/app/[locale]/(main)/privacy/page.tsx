import { getTranslations } from "next-intl/server";
import { Shield, Database, HardDrive, Globe, RefreshCw } from "lucide-react";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  const sections = [
    { icon: Database, title: t("collectTitle"), text: t("collectText") },
    { icon: HardDrive, title: t("storageTitle"), text: t("storageText") },
    { icon: Globe, title: t("thirdTitle"), text: t("thirdText") },
    { icon: RefreshCw, title: t("changesTitle"), text: t("changesText") },
  ];

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
      </div>
      <p className="text-gray-400 text-sm mb-10">{t("intro")}</p>

      <div className="flex flex-col gap-8">
        {sections.map(({ icon: Icon, title, text }) => (
          <section key={title}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-cyan-400/70" />
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{text}</p>
          </section>
        ))}
      </div>

      <p className="text-gray-600 text-xs mt-10">{t("lastUpdated")}</p>
    </main>
  );
}
