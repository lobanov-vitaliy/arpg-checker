import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface ConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
}

const STYLES: Record<"high" | "medium" | "low", string> = {
  high: "bg-green-500/15 text-green-400 border-green-500/25",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  low: "bg-orange-500/15 text-orange-400 border-orange-500/25",
};

const KEY_MAP: Record<"high" | "medium" | "low", "confidenceHigh" | "confidenceMedium" | "confidenceLow"> = {
  high: "confidenceHigh",
  medium: "confidenceMedium",
  low: "confidenceLow",
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const t = useTranslations("game");

  return (
    <Badge variant="outline" className={STYLES[confidence]}>
      {t(KEY_MAP[confidence])}
    </Badge>
  );
}
