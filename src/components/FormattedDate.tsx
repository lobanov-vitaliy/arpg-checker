"use client";

import { useEffect, useState } from "react";
import { formatDate, formatDateTime, hasTime } from "@/lib/utils";

interface FormattedDateProps {
  iso: string;
  locale: string;
  // When true and the ISO string has a time component, renders date + time in
  // the browser's local timezone after hydration. Falls back to date-only on
  // SSR to avoid hydration mismatches across server/client timezones.
  showTime?: boolean;
}

export function FormattedDate({ iso, locale, showTime }: FormattedDateProps) {
  const wantsTime = showTime && hasTime(iso);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (wantsTime) setMounted(true);
  }, [wantsTime]);

  if (!wantsTime) return <>{formatDate(iso, locale)}</>;
  return (
    <span suppressHydrationWarning>
      {mounted ? formatDateTime(iso, locale) : formatDate(iso, locale)}
    </span>
  );
}
