import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import type { SeasonStatus } from "@/types";

interface SeasonBadgeProps {
  status: SeasonStatus;
}

const STYLES: Record<SeasonStatus, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ended: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  unknown: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export function SeasonBadge({ status }: SeasonBadgeProps) {
  const t = useTranslations("badge");

  return (
    <Badge variant="outline" className={STYLES[status]}>
      {status === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse inline-block" />
      )}
      {t(status)}
    </Badge>
  );
}
